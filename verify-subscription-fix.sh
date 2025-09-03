#!/bin/bash

# 订阅Webhook修复验证脚本
# 用于验证Monthly/Yearly订阅支付后的权限更新是否正常

API_BASE="https://api.indicate.top"
USER_ID="7"
JWT_TOKEN=""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查JWT token
if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}❌ 请先设置JWT_TOKEN变量${NC}"
    echo "使用方法:"
    echo "1. 登录系统获取JWT token"
    echo "2. 设置环境变量: export JWT_TOKEN='your_jwt_token_here'"
    echo "3. 运行脚本: ./verify-subscription-fix.sh"
    exit 1
fi

echo -e "${BLUE}🚀 开始验证订阅Webhook修复...${NC}\n"

# 函数：发送API请求
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ "$method" = "GET" ]; then
        curl -s -H "Authorization: Bearer $JWT_TOKEN" \
             -H "Content-Type: application/json" \
             "$API_BASE$endpoint"
    else
        curl -s -X "$method" \
             -H "Authorization: Bearer $JWT_TOKEN" \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$API_BASE$endpoint"
    fi
}

# 1. 检查当前会员状态
echo -e "${YELLOW}=== 1. 检查当前会员状态 ===${NC}"
membership_status=$(make_request "GET" "/api/membership/status")
echo "$membership_status" | jq '.'

plan_id=$(echo "$membership_status" | jq -r '.data.planId // "null"')
is_active=$(echo "$membership_status" | jq -r '.data.isActive // false')
remaining_credits=$(echo "$membership_status" | jq -r '.data.remainingCredits // 0')

echo -e "\n当前状态总结:"
echo -e "套餐: ${BLUE}$plan_id${NC}"
echo -e "激活: ${BLUE}$is_active${NC}"
echo -e "积分: ${BLUE}$remaining_credits${NC}\n"

# 2. 检查调试信息
echo -e "${YELLOW}=== 2. 检查调试信息 ===${NC}"
debug_info=$(make_request "GET" "/api/debug/user/$USER_ID/membership")

if [ $? -eq 0 ]; then
    memberships_count=$(echo "$debug_info" | jq '.data.memberships | length')
    payments_count=$(echo "$debug_info" | jq '.data.paymentLogs | length')
    logs_count=$(echo "$debug_info" | jq '.data.systemLogs | length')
    
    echo -e "会员记录数: ${BLUE}$memberships_count${NC}"
    echo -e "支付日志数: ${BLUE}$payments_count${NC}"
    echo -e "系统日志数: ${BLUE}$logs_count${NC}"
    
    # 显示最新的会员记录
    if [ "$memberships_count" -gt 0 ]; then
        echo -e "\n最新会员记录:"
        echo "$debug_info" | jq '.data.memberships[0]'
    fi
    
    # 显示最新的支付日志
    if [ "$payments_count" -gt 0 ]; then
        echo -e "\n最新支付日志:"
        echo "$debug_info" | jq '.data.paymentLogs[0]'
    fi
else
    echo -e "${RED}❌ 无法获取调试信息${NC}"
fi

echo ""

# 3. 检查webhook事件
echo -e "${YELLOW}=== 3. 检查Webhook事件 ===${NC}"
webhook_events=$(make_request "GET" "/api/debug/webhook-events")

if [ $? -eq 0 ]; then
    webhook_logs_count=$(echo "$webhook_events" | jq '.data.webhookLogs | length')
    recent_payments_count=$(echo "$webhook_events" | jq '.data.recentPayments | length')
    
    echo -e "Webhook日志数: ${BLUE}$webhook_logs_count${NC}"
    echo -e "最近支付数: ${BLUE}$recent_payments_count${NC}"
    
    # 显示最新的webhook日志
    if [ "$webhook_logs_count" -gt 0 ]; then
        echo -e "\n最新Webhook日志:"
        echo "$webhook_events" | jq '.data.webhookLogs[0:3]'
    fi
else
    echo -e "${RED}❌ 无法获取Webhook事件信息${NC}"
fi

echo ""

# 4. 判断是否需要手动修复
echo -e "${YELLOW}=== 4. 修复建议 ===${NC}"

if [ "$plan_id" = "monthly" ] && [ "$is_active" = "true" ] && [ "$remaining_credits" = "9999" ]; then
    echo -e "${GREEN}✅ 月度订阅状态正常，无需修复${NC}"
elif [ "$plan_id" = "yearly" ] && [ "$is_active" = "true" ] && [ "$remaining_credits" = "9999" ]; then
    echo -e "${GREEN}✅ 年度订阅状态正常，无需修复${NC}"
elif [ "$plan_id" = "single" ] && [ "$is_active" = "true" ] && [ "$remaining_credits" -gt 0 ]; then
    echo -e "${GREEN}✅ 单次服务状态正常，无需修复${NC}"
else
    echo -e "${RED}⚠️ 会员状态异常，建议进行修复${NC}"
    echo ""
    echo "可选修复方案:"
    echo "1. 手动修复月度订阅:"
    echo "   curl -X POST -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
    echo "        -H \"Content-Type: application/json\" \\"
    echo "        -d '{\"planId\":\"monthly\",\"subscriptionId\":\"sub_1S2ud8Bb9puAdbwBmaCfXzVY\"}' \\"
    echo "        $API_BASE/api/debug/user/$USER_ID/fix-subscription"
    echo ""
    echo "2. 同步Stripe订阅状态:"
    echo "   curl -X POST $API_BASE/api/debug/sync-subscription/SUBSCRIPTION_ID"
    echo ""
    
    # 询问是否执行自动修复
    read -p "是否执行自动修复月度订阅? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🔧 执行自动修复...${NC}"
        fix_result=$(make_request "POST" "/api/debug/user/$USER_ID/fix-subscription" '{"planId":"monthly","subscriptionId":"sub_1S2ud8Bb9puAdbwBmaCfXzVY"}')
        echo "$fix_result" | jq '.'
        
        # 再次检查状态
        echo -e "\n${BLUE}🔍 修复后状态检查...${NC}"
        new_status=$(make_request "GET" "/api/membership/status")
        new_plan_id=$(echo "$new_status" | jq -r '.data.planId // "null"')
        new_is_active=$(echo "$new_status" | jq -r '.data.isActive // false')
        new_remaining_credits=$(echo "$new_status" | jq -r '.data.remainingCredits // 0')
        
        echo -e "修复后套餐: ${BLUE}$new_plan_id${NC}"
        echo -e "修复后激活: ${BLUE}$new_is_active${NC}"
        echo -e "修复后积分: ${BLUE}$new_remaining_credits${NC}"
        
        if [ "$new_plan_id" = "monthly" ] && [ "$new_is_active" = "true" ]; then
            echo -e "${GREEN}✅ 修复成功！${NC}"
        else
            echo -e "${RED}❌ 修复可能未完全成功，请检查日志${NC}"
        fi
    fi
fi

echo ""
echo -e "${BLUE}🏁 验证完成${NC}"

# 5. 总结报告
echo -e "\n${YELLOW}=== 总结报告 ===${NC}"
echo "时间: $(date)"
echo "用户ID: $USER_ID"
echo "当前套餐: $plan_id"
echo "激活状态: $is_active"
echo "剩余积分: $remaining_credits"

if [ "$plan_id" != "null" ] && [ "$is_active" = "true" ]; then
    echo -e "状态: ${GREEN}正常${NC}"
else
    echo -e "状态: ${RED}异常${NC}"
fi

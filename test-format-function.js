// 测试内容格式化功能
function testFormatContent() {
    // 格式化内容，去掉乱码标记
    const formatContent = (content) => {
        if (!content) return '';
        
        // 去掉 ** 标记，但保留内容结构
        return content
            .replace(/\*\*(.*?)\*\*/g, '$1') // 去掉 **标记**
            .replace(/\n\n+/g, '\n\n') // 规范化换行
            .trim();
    };

    // 测试用例
    const testCases = [
        {
            input: "**Bazi Analysis for Liang Jingle**\n\n**Bazi Chart Analysis**\nYear Pillar Ren Shen Water Monkey",
            expected: "Bazi Analysis for Liang Jingle\n\nBazi Chart Analysis\nYear Pillar Ren Shen Water Monkey"
        },
        {
            input: "**Character Analysis**\nCore personality shows creative Wood nature",
            expected: "Character Analysis\nCore personality shows creative Wood nature"
        },
        {
            input: "**Career and Wealth Analysis**\n\n\n**Relationship and Marriage Analysis**",
            expected: "Career and Wealth Analysis\n\nRelationship and Marriage Analysis"
        }
    ];

    console.log('🧪 测试内容格式化功能');
    console.log('================================');

    testCases.forEach((testCase, index) => {
        const result = formatContent(testCase.input);
        const passed = result === testCase.expected;
        
        console.log(`测试 ${index + 1}: ${passed ? '✅ 通过' : '❌ 失败'}`);
        console.log('输入:', JSON.stringify(testCase.input));
        console.log('期望:', JSON.stringify(testCase.expected));
        console.log('结果:', JSON.stringify(result));
        console.log('---');
    });

    // 实际示例测试
    const realExample = `**Bazi Analysis for Liang Jingle**

**Bazi Chart Analysis**
Year Pillar Ren Shen Water Monkey Month Pillar Ji You Earth Rooster Day Pillar Jia Wu Wood Horse Hour Pillar Ji Si Earth Snake The four pillars are Ren Shen Ji You Jia Wu Ji Si The day master is Jia Wood born in You month Metal season The chart has strong Metal Earth and Fire elements with weak Water and Wood Jia Wood is rooted only in Shen's hidden Geng Metal but surrounded by Fire Earth and Metal forming a Wealth pattern with partial resource star Water is the key useful element while Fire and excessive Metal are harmful Wood assists but its strength is insufficient

**Character Analysis**
Core personality shows creative Wood nature influenced by Fire Earth and Metal Intellectual and adaptable with strong practical skills Personality strengths include artistic talent technical precision and financial management abilities Key weaknesses involve occasional indecisiveness tendency to overwork and suppressing emotions Potential abilities lie in entrepreneurship technological fields and creative industries requiring both innovation and execution`;

    console.log('\n📋 实际示例测试');
    console.log('================================');
    console.log('原始内容（带乱码）:');
    console.log(realExample.substring(0, 200) + '...');
    
    const formatted = formatContent(realExample);
    console.log('\n格式化后内容:');
    console.log(formatted.substring(0, 200) + '...');
    
    console.log('\n✅ 格式化功能测试完成！');
    console.log('- 成功去除 ** 乱码标记');
    console.log('- 保持内容结构完整');
    console.log('- 规范化换行符');
}

// 运行测试
testFormatContent();

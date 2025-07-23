'use client';

import React, { useState } from 'react';
import { performAnalysis, validateAnalysisRequest, AnalysisRequest } from '../../lib/api-client';

// 简化的演示页面，不依赖外部库
export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    birthDate: '',
    birthPlace: ''
  });
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const request: AnalysisRequest = {
        ...formData,
        analysisType: 'demo'
      };

      // 验证请求数据
      const validationErrors = validateAnalysisRequest(request);
      if (validationErrors.length > 0) {
        alert(validationErrors.join('\n'));
        setLoading(false);
        return;
      }

      // 调用真实的 API
      const response = await performAnalysis(request);

      if (response.success && response.data) {
        setResult({
          overallScore: response.data.overallScore,
          baziData: response.data.baziData,
          fortune: response.data.fortune
        });
      } else {
        alert(response.error || '分析失败，请稍后重试');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      alert('分析过程中发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#1890ff',
        marginBottom: '30px'
      }}>
        🔮 命理分析系统演示
      </h1>
      
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2>个人信息</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>姓名:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>性别:</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>出生日期时间:</label>
            <input
              type="datetime-local"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>出生地点:</label>
            <input
              type="text"
              name="birthPlace"
              value={formData.birthPlace}
              onChange={handleInputChange}
              placeholder="例如：北京，中国"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#ccc' : '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '分析中...' : '开始命运分析'}
          </button>
        </form>
      </div>

      {loading && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔮</div>
          <h3>正在分析您的命运...</h3>
          <p>请稍候，我们正在计算您的八字和紫微斗数...</p>
          <div style={{
            width: '100%',
            height: '4px',
            background: '#f0f0f0',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '20px'
          }}>
            <div style={{
              width: '30%',
              height: '100%',
              background: '#1890ff',
              animation: 'loading 2s infinite'
            }}></div>
          </div>
        </div>
      )}

      {result && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2>🎉 分析结果</h2>
          
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1890ff'
            }}>
              {result.overallScore}/100
            </div>
            <p>综合运势评分</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{ padding: '15px', background: '#f6ffed', borderRadius: '6px' }}>
              <h4>🏆 事业运势</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {result.fortune.career.score}/100
              </div>
              <p style={{ fontSize: '14px', margin: '10px 0 0 0' }}>
                {result.fortune.career.advice}
              </p>
            </div>
            
            <div style={{ padding: '15px', background: '#fff7e6', borderRadius: '6px' }}>
              <h4>💰 财运</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                {result.fortune.wealth.score}/100
              </div>
              <p style={{ fontSize: '14px', margin: '10px 0 0 0' }}>
                {result.fortune.wealth.advice}
              </p>
            </div>
            
            <div style={{ padding: '15px', background: '#fff0f6', borderRadius: '6px' }}>
              <h4>💕 感情运势</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eb2f96' }}>
                {result.fortune.love.score}/100
              </div>
              <p style={{ fontSize: '14px', margin: '10px 0 0 0' }}>
                {result.fortune.love.advice}
              </p>
            </div>
            
            <div style={{ padding: '15px', background: '#f6ffed', borderRadius: '6px' }}>
              <h4>🏥 健康运势</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {result.fortune.health.score}/100
              </div>
              <p style={{ fontSize: '14px', margin: '10px 0 0 0' }}>
                {result.fortune.health.advice}
              </p>
            </div>
          </div>

          <div style={{
            background: '#f0f2f5',
            padding: '20px',
            borderRadius: '6px'
          }}>
            <h3>📊 八字信息</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              textAlign: 'center'
            }}>
              <div>
                <strong>年柱</strong><br/>
                {result.baziData.year.heavenlyStem}{result.baziData.year.earthlyBranch}<br/>
                <small>({result.baziData.year.element})</small>
              </div>
              <div>
                <strong>月柱</strong><br/>
                {result.baziData.month.heavenlyStem}{result.baziData.month.earthlyBranch}<br/>
                <small>({result.baziData.month.element})</small>
              </div>
              <div>
                <strong>日柱</strong><br/>
                {result.baziData.day.heavenlyStem}{result.baziData.day.earthlyBranch}<br/>
                <small>({result.baziData.day.element})</small>
              </div>
              <div>
                <strong>时柱</strong><br/>
                {result.baziData.hour.heavenlyStem}{result.baziData.hour.earthlyBranch}<br/>
                <small>({result.baziData.hour.element})</small>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}

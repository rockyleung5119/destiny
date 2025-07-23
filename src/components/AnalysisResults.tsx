'use client';

import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Typography,
  Tag,
  Space,
  Divider,
  Progress,
  Timeline,
  Alert
} from 'antd';
import {
  TrophyOutlined,
  DollarOutlined,
  HeartOutlined,
  StarOutlined,
  CalendarOutlined,
  BulbOutlined
} from '@ant-design/icons';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { AnalysisResult } from '@/types';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result }) => {
  // Prepare radar chart data
  const radarData = [
    { subject: 'Career', score: result.fortune.career.score, fullMark: 100 },
    { subject: 'Wealth', score: result.fortune.wealth.score, fullMark: 100 },
    { subject: 'Love', score: result.fortune.love.score, fullMark: 100 },
    { subject: 'Health', score: result.fortune.health.score, fullMark: 100 },
  ];

  // Prepare elements chart data
  const elementsData = result.baziData ? [
    { name: 'Wood', value: result.baziData.elements.wood, color: '#52c41a' },
    { name: 'Fire', value: result.baziData.elements.fire, color: '#ff4d4f' },
    { name: 'Earth', value: result.baziData.elements.earth, color: '#fa8c16' },
    { name: 'Metal', value: result.baziData.elements.metal, color: '#fadb14' },
    { name: 'Water', value: result.baziData.elements.water, color: '#1890ff' },
  ] : [];

  const renderOverviewTab = () => (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Overall Fortune Score" bordered={false}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={result.fortune.overallScore}
                size={120}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Title level={3} style={{ marginTop: '16px' }}>
                {result.fortune.overallScore}/100
              </Title>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Fortune Radar" bordered={false}>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Career Fortune"
              value={result.fortune.career.score}
              valueStyle={{ color: '#1890ff' }}
              prefix={<TrophyOutlined />}
            />
            <Paragraph style={{ marginTop: '10px', fontSize: '12px' }}>
              {result.fortune.career.advice}
            </Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Wealth Fortune"
              value={result.fortune.wealth.score}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarOutlined />}
            />
            <Paragraph style={{ marginTop: '10px', fontSize: '12px' }}>
              {result.fortune.wealth.advice}
            </Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Love Fortune"
              value={result.fortune.love.score}
              valueStyle={{ color: '#eb2f96' }}
              prefix={<HeartOutlined />}
            />
            <Paragraph style={{ marginTop: '10px', fontSize: '12px' }}>
              {result.fortune.love.advice}
            </Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Health Fortune"
              value={result.fortune.health.score}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<StarOutlined />}
            />
            <Paragraph style={{ marginTop: '10px', fontSize: '12px' }}>
              {result.fortune.health.advice}
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderBaziTab = () => {
    if (!result.baziData) {
      return <Alert message="Bazi data not available" type="info" />;
    }

    return (
      <div>
        <Card title="Four Pillars (Bazi)" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" title="Year Pillar">
                <Text strong>
                  {result.baziData.year.heavenlyStem}{result.baziData.year.earthlyBranch}
                </Text>
                <br />
                <Tag color="blue">{result.baziData.year.element}</Tag>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" title="Month Pillar">
                <Text strong>
                  {result.baziData.month.heavenlyStem}{result.baziData.month.earthlyBranch}
                </Text>
                <br />
                <Tag color="green">{result.baziData.month.element}</Tag>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" title="Day Pillar">
                <Text strong>
                  {result.baziData.day.heavenlyStem}{result.baziData.day.earthlyBranch}
                </Text>
                <br />
                <Tag color="red">{result.baziData.day.element}</Tag>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" title="Hour Pillar">
                <Text strong>
                  {result.baziData.hour.heavenlyStem}{result.baziData.hour.earthlyBranch}
                </Text>
                <br />
                <Tag color="orange">{result.baziData.hour.element}</Tag>
              </Card>
            </Col>
          </Row>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Five Elements Distribution">
              <Space wrap>
                <Tag color="green">Wood: {result.baziData.elements.wood}</Tag>
                <Tag color="red">Fire: {result.baziData.elements.fire}</Tag>
                <Tag color="orange">Earth: {result.baziData.elements.earth}</Tag>
                <Tag color="gold">Metal: {result.baziData.elements.metal}</Tag>
                <Tag color="blue">Water: {result.baziData.elements.water}</Tag>
              </Space>
              
              <div style={{ height: '200px', marginTop: '16px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={elementsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="Ten Gods Analysis">
              <Paragraph>
                <Text strong>Day Master:</Text> {result.baziData.tenGods.dayMaster}
              </Paragraph>
              
              <Paragraph>
                <Text strong>Favorable Gods:</Text>
                <br />
                <Space wrap>
                  {result.baziData.tenGods.favorable.map((god, index) => (
                    <Tag key={index} color="green">{god}</Tag>
                  ))}
                </Space>
              </Paragraph>
              
              <Paragraph>
                <Text strong>Unfavorable Gods:</Text>
                <br />
                <Space wrap>
                  {result.baziData.tenGods.unfavorable.map((god, index) => (
                    <Tag key={index} color="red">{god}</Tag>
                  ))}
                </Space>
              </Paragraph>
              
              <Paragraph>
                <Text strong>Spirits:</Text>
                <br />
                <Space wrap>
                  {result.baziData.spirits.map((spirit, index) => (
                    <Tag key={index} color="purple">{spirit}</Tag>
                  ))}
                </Space>
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderPredictionsTab = () => {
    if (!result.predictions) {
      return <Alert message="Predictions not available" type="info" />;
    }

    return (
      <div>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title={<><CalendarOutlined /> Future Predictions</>}>
              <Timeline>
                <Timeline.Item color="blue">
                  <Text strong>Next Month</Text>
                  <br />
                  {result.predictions.nextMonth}
                </Timeline.Item>
                <Timeline.Item color="green">
                  <Text strong>Next Year</Text>
                  <br />
                  {result.predictions.nextYear}
                </Timeline.Item>
              </Timeline>
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title={<><BulbOutlined /> Major Life Events</>}>
              <ul>
                {result.predictions.majorEvents.map((event, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    {event}
                  </li>
                ))}
              </ul>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderAdviceTab = () => (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title="General Life Advice">
            <Paragraph style={{ fontSize: '16px' }}>
              {result.advice.general}
            </Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Career Advice" size="small">
            <Paragraph>{result.advice.career}</Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Wealth Advice" size="small">
            <Paragraph>{result.advice.wealth}</Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Love Advice" size="small">
            <Paragraph>{result.advice.love}</Paragraph>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Health Advice" size="small">
            <Paragraph>{result.advice.health}</Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div>
      <Card 
        title={
          <Title level={2} style={{ margin: 0 }}>
            <TrophyOutlined /> Your Destiny Analysis Results
          </Title>
        } 
        style={{ marginBottom: '24px' }}
      >
        <Paragraph style={{ fontSize: '16px', textAlign: 'center' }}>
          Analysis completed on {new Date(result.createdAt).toLocaleDateString()}
        </Paragraph>
      </Card>

      <Tabs defaultActiveKey="overview" size="large">
        <TabPane tab={<span><StarOutlined />Overview</span>} key="overview">
          {renderOverviewTab()}
        </TabPane>
        
        <TabPane tab="Bazi Analysis" key="bazi">
          {renderBaziTab()}
        </TabPane>
        
        <TabPane tab="Predictions" key="predictions">
          {renderPredictionsTab()}
        </TabPane>
        
        <TabPane tab="Life Advice" key="advice">
          {renderAdviceTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};

"use client";

import React, { useState, useTransition } from 'react';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Radio,
  Upload,
  message,
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Select,
  Progress,
  Tabs,
  Statistic,
  Alert,
  Space,
  Tag,
  Divider
} from 'antd';
import { UploadOutlined, StarOutlined, TrophyOutlined, HeartOutlined, DollarOutlined } from '@ant-design/icons';
import type { DatePickerProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const LocaleSwitcher = () => {
  const t = useTranslations('LocaleSwitcher');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (value: string) => {
    const nextLocale = value;
    startTransition(() => {
      router.replace(`/${nextLocale}`);
    });
  };

  return (
    <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
      <Select defaultValue={pathname.split('/')[1] || 'en'} onChange={onSelectChange} disabled={isPending}>
        <Option value="en">{t('en')}</Option>
        <Option value="zh">{t('zh')}</Option>
      </Select>
    </div>
  );
};


const FortuneTellingForm: React.FC = () => {
  const t = useTranslations('FortuneTellingForm');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [faceImage, setFaceImage] = useState<UploadFile[]>([]);
  const [palmImage, setPalmImage] = useState<UploadFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('form');

  const onFinish = async (values: any) => {
    setLoading(true);
    setResult(null);
    setProgress(0);
    setProgressMessage('');
    setActiveTab('progress');

    try {
      const formData = {
        birthInfo: {
          name: values.name,
          gender: values.gender,
          birthDate: values.birthDate.format('YYYY-MM-DD HH:mm:ss'),
          birthPlace: values.birthPlace,
        },
        analysisType: 'comprehensive',
        faceImageUrl: faceImage.length > 0 ? faceImage[0].thumbUrl : null,
        palmImageUrl: palmImage.length > 0 ? palmImage[0].thumbUrl : null,
        options: {
          includeDaily: true,
          includePredictions: true,
          detailLevel: 'basic'
        }
      };

      // Submit analysis request
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await response.json();
      setAnalysisId(data.data.id);

      // Start polling for progress
      pollProgress(data.data.id);

    } catch (error) {
      console.error('Analysis error:', error);
      message.error('Analysis failed. Please try again.');
      setLoading(false);
      setActiveTab('form');
    }
  };

  const pollProgress = async (id: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/${id}/progress`);
        const data = await response.json();

        if (data.success) {
          setProgress(data.data.progress);
          setProgressMessage(data.data.message);

          if (data.data.status === 'completed') {
            clearInterval(pollInterval);
            // Fetch final results
            const resultResponse = await fetch(`/api/analysis/${id}`);
            const resultData = await resultResponse.json();

            if (resultData.success) {
              setResult(resultData.data);
              setActiveTab('results');
              message.success(t('successMessage'));
            }
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Progress polling error:', error);
        clearInterval(pollInterval);
        setLoading(false);
        setActiveTab('form');
      }
    }, 2000);

    // Cleanup after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (loading) {
        setLoading(false);
        setActiveTab('form');
        message.error('Analysis timeout. Please try again.');
      }
    }, 120000);
  };

  const onBirthDateChange: DatePickerProps['onChange'] = (date, dateString) => {
    console.log(date, dateString);
  };

  const handleUploadChange = (setter: React.Dispatch<React.SetStateAction<UploadFile[]>>) => ({ fileList }: { fileList: UploadFile[] }) => {
    setter(fileList);
  };

  const renderProgressView = () => (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Spin size="large" />
        <Title level={3} style={{ marginTop: '20px' }}>
          {t('analyzingTitle')}
        </Title>
        <Progress
          percent={progress}
          status={progress === 100 ? 'success' : 'active'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
        <Paragraph style={{ marginTop: '20px', fontSize: '16px' }}>
          {progressMessage}
        </Paragraph>
        {progress < 100 && (
          <Alert
            message="Upgrade to Premium for instant results!"
            description="Premium members get immediate access to all features without waiting."
            type="info"
            showIcon
            style={{ marginTop: '20px' }}
            action={
              <Button size="small" type="primary">
                Upgrade Now
              </Button>
            }
          />
        )}
      </div>
    </Card>
  );

  const renderResultsView = () => {
    if (!result) return null;

    const radarData = [
      { subject: 'Career', score: result.scores?.career || 0, fullMark: 100 },
      { subject: 'Wealth', score: result.scores?.wealth || 0, fullMark: 100 },
      { subject: 'Love', score: result.scores?.love || 0, fullMark: 100 },
      { subject: 'Health', score: result.scores?.health || 0, fullMark: 100 },
    ];

    return (
      <div>
        <Card title={t('resultTitle')} style={{ marginBottom: '20px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Statistic
                title="Overall Score"
                value={result.overallScore || 0}
                suffix="/ 100"
                valueStyle={{ color: '#3f8600' }}
                prefix={<TrophyOutlined />}
              />
            </Col>
            <Col xs={24} md={12}>
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
            </Col>
          </Row>
        </Card>

        <Tabs defaultActiveKey="overview">
          <TabPane tab={<span><StarOutlined />Overview</span>} key="overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Career"
                    value={result.scores?.career || 0}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<TrophyOutlined />}
                  />
                  <Paragraph style={{ marginTop: '10px', fontSize: '12px' }}>
                    {result.advice?.career || 'Focus on your strengths'}
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Wealth"
                    value={result.scores?.wealth || 0}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<DollarOutlined />}
                  />
                  <Paragraph style={{ marginTop: '10px', fontSize: '12px' }}>
                    {result.advice?.wealth || 'Manage finances wisely'}
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Love"
                    value={result.scores?.love || 0}
                    valueStyle={{ color: '#eb2f96' }}
                    prefix={<HeartOutlined />}
                  />
                  <Paragraph style={{ marginTop: '10px', fontSize: '12px' }}>
                    {result.advice?.love || 'Nurture relationships'}
                  </Paragraph>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Health"
                    value={result.scores?.health || 0}
                    valueStyle={{ color: '#fa8c16' }}
                    prefix={<StarOutlined />}
                  />
                  <Paragraph style={{ marginTop: '10px', fontSize: '12px' }}>
                    {result.advice?.health || 'Maintain good habits'}
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Detailed Analysis" key="detailed">
            <Card>
              <Title level={4}>Bazi Analysis</Title>
              {result.baziData && (
                <div>
                  <Paragraph>
                    <Text strong>Year Pillar:</Text> {result.baziData.year.heavenlyStem}{result.baziData.year.earthlyBranch} ({result.baziData.year.element})
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Month Pillar:</Text> {result.baziData.month.heavenlyStem}{result.baziData.month.earthlyBranch} ({result.baziData.month.element})
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Day Pillar:</Text> {result.baziData.day.heavenlyStem}{result.baziData.day.earthlyBranch} ({result.baziData.day.element})
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Hour Pillar:</Text> {result.baziData.hour.heavenlyStem}{result.baziData.hour.earthlyBranch} ({result.baziData.hour.element})
                  </Paragraph>

                  <Divider />

                  <Title level={5}>Five Elements Distribution</Title>
                  <Space wrap>
                    <Tag color="green">Wood: {result.baziData.elements.wood}</Tag>
                    <Tag color="red">Fire: {result.baziData.elements.fire}</Tag>
                    <Tag color="orange">Earth: {result.baziData.elements.earth}</Tag>
                    <Tag color="gold">Metal: {result.baziData.elements.metal}</Tag>
                    <Tag color="blue">Water: {result.baziData.elements.water}</Tag>
                  </Space>
                </div>
              )}
            </Card>
          </TabPane>

          <TabPane tab="Predictions" key="predictions">
            <Card>
              <Title level={4}>Future Predictions</Title>
              {result.predictions && (
                <div>
                  <Paragraph>
                    <Text strong>Next Month:</Text> {result.predictions.nextMonth}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Next Year:</Text> {result.predictions.nextYear}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>Major Events:</Text>
                  </Paragraph>
                  <ul>
                    {result.predictions.majorEvents?.map((event: string, index: number) => (
                      <li key={index}>{event}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
    );
  };

  return (
    <Row justify="center" style={{ marginTop: '2rem', position: 'relative' }}>
      <Col xs={24} sm={22} md={20} lg={18} xl={16}>
        <LocaleSwitcher />
        <Title level={1} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {t('title')}
        </Title>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          size="large"
        >
          <TabPane tab="Analysis Form" key="form">
            <Card>
              <Paragraph style={{ textAlign: 'center', fontSize: '16px', marginBottom: '2rem' }}>
                {t('description')}
              </Paragraph>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                size="large"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="name" label={t('nameLabel')} rules={[{ required: true }]}>
                      <Input placeholder="Enter your full name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="gender" label={t('genderLabel')} rules={[{ required: true }]}>
                      <Radio.Group>
                        <Radio value="male">{t('male')}</Radio>
                        <Radio value="female">{t('female')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="birthDate" label={t('birthDateLabel')} rules={[{ required: true }]}>
                      <DatePicker
                        showTime
                        onChange={onBirthDateChange}
                        style={{ width: '100%' }}
                        placeholder="Select date and time"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="birthPlace" label={t('birthPlaceLabel')} rules={[{ required: true }]}>
                      <Input placeholder={t('birthPlacePlaceholder')} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label={t('facePhotoLabel')}>
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        fileList={faceImage}
                        onChange={handleUploadChange(setFaceImage)}
                      >
                        {faceImage.length === 0 && (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Upload Face Photo</div>
                          </div>
                        )}
                      </Upload>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Optional: For face reading analysis
                      </Text>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label={t('palmPhotoLabel')}>
                      <Upload
                        listType="picture-card"
                        maxCount={1}
                        beforeUpload={() => false}
                        fileList={palmImage}
                        onChange={handleUploadChange(setPalmImage)}
                      >
                        {palmImage.length === 0 && (
                          <div>
                            <UploadOutlined />
                            <div style={{ marginTop: 8 }}>Upload Palm Photo</div>
                          </div>
                        )}
                      </Upload>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Optional: For palm reading analysis
                      </Text>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginTop: '2rem' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    size="large"
                    style={{ height: '50px', fontSize: '16px' }}
                  >
                    {t('submitButton')}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>

          <TabPane tab="Analysis Progress" key="progress" disabled={!loading && !result}>
            {renderProgressView()}
          </TabPane>

          <TabPane tab="Results" key="results" disabled={!result}>
            {renderResultsView()}
          </TabPane>
        </Tabs>
      </Col>
    </Row>
  );
};

export default function HomePage() {
  return (
    <main>
      <FortuneTellingForm />
    </main>
  )
}

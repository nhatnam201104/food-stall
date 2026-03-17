import { Layout, Row, Col, Typography, Space, Divider } from 'antd';
import { FacebookOutlined, TwitterOutlined, InstagramOutlined, LinkedinOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Footer } = Layout;
const { Title, Text } = Typography;

export const PublicFooter = () => {
    return (
        <Footer style={{ background: '#f5f5f5', padding: '60px 50px 20px', marginTop: 'auto' }}>
            <Row gutter={[32, 32]} justify="space-between">
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Title level={4} style={{ color: '#1677ff' }}>FoodStall Hub</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Effective management, promotion, and ordering solution for street food carts and kiosks.
                    </Text>
                    <Space size="large">
                        <a href="https://facebook.com" target="_blank" rel="noreferrer"><FacebookOutlined style={{ fontSize: 20, color: '#1877f2' }} /></a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer"><TwitterOutlined style={{ fontSize: 20, color: '#1da1f2' }} /></a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer"><InstagramOutlined style={{ fontSize: 20, color: '#e1306c' }} /></a>
                        <a href="https://linkedin.com" target="_blank" rel="noreferrer"><LinkedinOutlined style={{ fontSize: 20, color: '#0a66c2' }} /></a>
                    </Space>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={5}>
                    <Title level={5}>Quick Links</Title>
                    <Space direction="vertical" size="small">
                        <Link to="/" style={{ color: '#666' }}>Home</Link>
                        <Link to="/pricing" style={{ color: '#666' }}>Pricing</Link>
                        <Link to="/contact" style={{ color: '#666' }}>Contact</Link>
                    </Space>
                </Col>

                <Col xs={24} sm={12} md={8} lg={5}>
                    <Title level={5}>Customer Support</Title>
                    <Space direction="vertical" size="small">
                        <Link to="/help" style={{ color: '#666' }}>Help Center</Link>
                        <Link to="/terms" style={{ color: '#666' }}>Terms of Use</Link>
                        <Link to="/privacy" style={{ color: '#666' }}>Privacy Policy</Link>
                        <Link to="/faq" style={{ color: '#666' }}>FAQ</Link>
                    </Space>
                </Col>

                <Col xs={24} sm={12} md={24} lg={8}>
                    <Title level={5}>Subscribe</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Receive updates on new features and attractive promotions from us.
                    </Text>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input type="email" placeholder="Enter your email address..." style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #d9d9d9', outline: 'none' }} />
                        <button style={{ background: '#1677ff', color: '#fff', border: 'none', borderRadius: '4px', padding: '0 16px', cursor: 'pointer', transition: 'background 0.3s' }} onMouseOver={(e) => e.currentTarget.style.background = '#0958d9'} onMouseOut={(e) => e.currentTarget.style.background = '#1677ff'}>Send</button>
                    </div>
                </Col>
            </Row>

            <Divider style={{ margin: '30px 0 20px' }} />
            
            <div style={{ textAlign: 'center' }}>
                <Text type="secondary">© {new Date().getFullYear()} FoodStall Hub. All rights reserved.</Text>
            </div>
        </Footer>
    );
};
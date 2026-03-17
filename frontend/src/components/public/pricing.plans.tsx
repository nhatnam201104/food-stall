import { Row, Col, Typography, Card, Button, List } from 'antd';
import { motion } from 'framer-motion';
import { CheckCircleFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

const plans = [
    {
        title: 'Basic',
        price: 'Free',
        period: '/month',
        description: 'For individuals starting out, small carts.',
        features: [
            'Manage up to 5 stores/kiosks',
            'Basic map location display',
            'Food management interface',
            'Email support'
        ],
        buttonText: 'Start for Free',
        isPopular: false
    },
    {
        title: 'Professional',
        price: '$12',
        period: '/month',
        description: 'Suitable for medium to large scale street cart chains.',
        features: [
            'Unlimited store management',
            'Real-time positioning and route tracking',
            'Advanced reports and statistics',
            'Employee role management',
            'Priority 24/7 Support'
        ],
        buttonText: 'Get Pro Plan',
        isPopular: true
    },
    {
        title: 'Enterprise',
        price: 'Contact Us',
        period: '',
        description: 'Optimal customized solution for large franchise systems.',
        features: [
            'All Professional plan features',
            'Own custom domain and branding',
            'API integration with other POS systems',
            'Dedicated Account Manager'
        ],
        buttonText: 'Get a Consultation',
        isPopular: false
    }
];

export const PricingPlans = () => {
    return (
        <div style={{ padding: '80px 20px', background: '#fff' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <Title level={2}>Flexible Pricing</Title>
                    <Text type="secondary" style={{ fontSize: '1.2rem', maxWidth: 600, margin: '0 auto', display: 'block' }}>
                        Start for free, upgrade when you are ready to scale your business.
                    </Text>
                </div>

                <Row gutter={[32, 32]} justify="center" align="middle">
                    {plans.map((plan, index) => (
                        <Col xs={24} md={8} key={index}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                <Card 
                                    style={{ 
                                        borderRadius: 16, 
                                        border: plan.isPopular ? '2px solid #1677ff' : '1px solid #f0f0f0',
                                        boxShadow: plan.isPopular ? '0 12px 24px rgba(22,119,255,0.1)' : 'none',
                                        position: 'relative'
                                    }}
                                    headStyle={{ borderBottom: 'none', padding: '24px 24px 0' }}
                                    bodyStyle={{ padding: '24px' }}
                                >
                                    {plan.isPopular && (
                                        <div style={{
                                            position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)',
                                            background: '#1677ff', color: '#fff', padding: '4px 16px', borderRadius: 20,
                                            fontWeight: 'bold', fontSize: '0.9rem'
                                        }}>
                                            MOST POPULAR
                                        </div>
                                    )}
                                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                        <Title level={4} style={{ margin: 0 }}>{plan.title}</Title>
                                        <Text type="secondary">{plan.description}</Text>
                                        <div style={{ marginTop: 24 }}>
                                            <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>{plan.price}</span>
                                            {plan.period && <span style={{ color: '#888' }}>{plan.period}</span>}
                                        </div>
                                    </div>

                                    <Button 
                                        type={plan.isPopular ? 'primary' : 'default'} 
                                        size="large" 
                                        block 
                                        style={{ marginBottom: 24, borderRadius: 8 }}
                                    >
                                        {plan.buttonText}
                                    </Button>

                                    <List
                                        dataSource={plan.features}
                                        renderItem={item => (
                                            <List.Item style={{ border: 'none', padding: '8px 0', alignItems: 'flex-start' }}>
                                                <CheckCircleFilled style={{ color: '#52c41a', marginRight: 12, marginTop: 4 }} />
                                                <span style={{ color: '#444' }}>{item}</span>
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};
import { Row, Col, Typography, Card } from 'antd';
import { motion } from 'framer-motion';
import { ShopOutlined, EnvironmentOutlined, BarChartOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const features = [
    {
        icon: <ShopOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
        title: 'Store Management (POI)',
        description: 'Easily add, edit information and tracking locations of each of your kiosks or food carts.'
    },
    {
        icon: <EnvironmentOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
        title: 'Distribution Map',
        description: 'View an intuitive overview of your store network right on the map, optimizing sale point placements.'
    },
    {
        icon: <BarChartOutlined style={{ fontSize: 32, color: '#faad14' }} />,
        title: 'Business Analytics',
        description: 'Track detailed metrics, evaluate revenue of each point of sale, and make smart decisions.'
    },
    {
        icon: <TeamOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
        title: 'Customer Management',
        description: 'Capture visitor data and customer interests to enhance your marketing strategies.'
    }
];

export const HomeFeatures = () => {
    return (
        <div style={{ padding: '80px 20px', background: '#fff' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <Title level={2}>Key Features</Title>
                    <Text type="secondary" style={{ fontSize: '1.1rem' }}>
                        Discover powerful tools exclusively for street food business owners.
                    </Text>
                </div>

                <Row gutter={[24, 24]}>
                    {features.map((item, index) => (
                        <Col xs={24} sm={12} md={6} key={index}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card hoverable style={{ height: '100%', borderRadius: 12, textAlign: 'center', padding: '20px 10px' }}>
                                    <div style={{ marginBottom: 20 }}>{item.icon}</div>
                                    <Title level={4}>{item.title}</Title>
                                    <Text type="secondary">{item.description}</Text>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};
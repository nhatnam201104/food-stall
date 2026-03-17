import { Row, Col, Typography, Card, Avatar } from 'antd';
import { motion } from 'framer-motion';
import { StarFilled } from '@ant-design/icons';

const { Title, Text } = Typography;

const testimonials = [
    {
        name: 'Nguyen Van A',
        role: 'Owner of 3 Regions Banh Mi Chain',
        content: 'Since using this system, managing my 15 Banh Mi carts has become easier than ever. I can view live revenue every day.',
        rate: 5
    },
    {
        name: 'Tran Thi B',
        role: 'Milk Tea System Founder',
        content: 'The map tracking feature is fantastic. I can easily monitor if my staff have opened shops at the right locations. A great solution for street vendors!',
        rate: 5
    },
    {
        name: 'Le Hoang C',
        role: 'Skewers Stall Manager',
        content: 'Opening a new point of sale and configuring the menu takes just a blink of an eye. The mobile interface is especially convenient for on-site staff.',
        rate: 4
    }
];

export const HomeTestimonials = () => {
    return (
        <div style={{ padding: '80px 20px', background: '#fafafa' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <Title level={2}>What Our Customers Say</Title>
                    <Text type="secondary" style={{ fontSize: '1.1rem' }}>
                        Hundreds of stall owners have chosen FoodStall Hub as their companion.
                    </Text>
                </div>

                <Row gutter={[24, 24]}>
                    {testimonials.map((item, index) => (
                        <Col xs={24} md={8} key={index}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <Card style={{ height: '100%', borderRadius: 12 }}>
                                    <div style={{ marginBottom: 16 }}>
                                        {[...Array(5)].map((_, i) => (
                                            <StarFilled key={i} style={{ color: i < item.rate ? '#fadb14' : '#f0f0f0', marginRight: 4 }} />
                                        ))}
                                    </div>
                                    <Text style={{ fontSize: '1.1rem', fontStyle: 'italic', display: 'block', marginBottom: 24 }}>
                                        "{item.content}"
                                    </Text>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Avatar size="large" style={{ backgroundColor: '#1677ff' }}>{item.name[0]}</Avatar>
                                        <div>
                                            <Title level={5} style={{ margin: 0 }}>{item.name}</Title>
                                            <Text type="secondary">{item.role}</Text>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};
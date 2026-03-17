import { Button, Typography } from 'antd';
import { motion } from 'framer-motion';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

const { Title, Text } = Typography;

export const HomeHero = () => {
    return (
        <div style={{ 
            padding: '100px 20px', 
            textAlign: 'center', 
            background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                style={{ maxWidth: 800, margin: '0 auto', zIndex: 2, position: 'relative' }}
            >
                <Title style={{ fontSize: '3rem', fontWeight: 800, marginBottom: 24 }}>
                    Comprehensive <span style={{ color: '#1677ff' }}>Food Stall</span> Management Platform
                </Title>
                <Text style={{ fontSize: '1.2rem', color: '#666', display: 'block', marginBottom: 40 }}>
                    FoodStall Hub is the ultimate solution to help you manage street food carts, kiosks, 
                    track business performance, and intelligently optimize your point-of-sale system.
                </Text>
                
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to={ROUTES.auth.merchantRegister}>
                        <Button type="primary" size="large" icon={<ArrowRightOutlined />} style={{ height: 48, padding: '0 32px', fontSize: '1.1rem', borderRadius: 8 }}>
                            Start for Free
                        </Button>
                    </Link>
                    <Link to={ROUTES.public.pricing}>
                        <Button size="large" style={{ height: 48, padding: '0 32px', fontSize: '1.1rem', borderRadius: 8 }}>
                            View Pricing
                        </Button>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};
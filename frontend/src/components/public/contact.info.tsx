import { Typography, Space } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, MailOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

export const ContactInfo = () => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ padding: '20px' }}
        >
            <Title level={3} style={{ marginBottom: 24 }}>Contact Information</Title>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EnvironmentOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '1.1rem' }}>Headquarters</Text>
                        <Text type="secondary">Hi-Tech Park, District 9, Ho Chi Minh City, Vietnam</Text>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PhoneOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '1.1rem' }}>Consultation Hotline</Text>
                        <Text type="secondary">1900 1234 (Toll-free)</Text>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MailOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '1.1rem' }}>Support Email</Text>
                        <Text type="secondary">support@foodstallhub.com</Text>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e6f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClockCircleOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                    </div>
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '1.1rem' }}>Working Hours</Text>
                        <Text type="secondary">Mon - Fri: 08:00 - 18:00</Text><br/>
                        <Text type="secondary">Sat: 08:00 - 12:00</Text>
                    </div>
                </div>
            </Space>

            <div style={{ marginTop: 40, height: 250, borderRadius: 16, overflow: 'hidden', background: '#eee' }}>
                <iframe
                    title="Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.4206639912064!2d106.78252277561875!3d10.85557478932785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175276e7ea103df%3A0xb6cf10bb7d719327!2zSFAy!5e0!3m2!1sen!2s!4v1703673751221!5m2!1sen!2s"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </div>
        </motion.div>
    );
};
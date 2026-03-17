import { Form, Input, Button, Typography, notification } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ContactForm = () => {
    const [form] = Form.useForm();

    const onFinish = (values: Record<string, string>) => {
        console.log('Received values:', values);
        notification.success({
            message: 'Message Sent!',
            description: 'Thank you for reaching out. Our support team will respond within 24 business hours.',
            placement: 'bottomRight'
        });
        form.resetFields();
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ 
                background: '#fff', 
                padding: '40px', 
                borderRadius: '16px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)' 
            }}
        >
            <Title level={3} style={{ marginBottom: 8 }}>Send a Message</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 32 }}>
                Fill out the form below, we'll get back to you shortly.
            </Text>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                size="large"
            >
                <div style={{ display: 'flex', gap: '16px' }}>
                    <Form.Item
                        name="name"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter your full name!' }]}
                        style={{ flex: 1 }}
                    >
                        <Input placeholder="John Doe" />
                    </Form.Item>

                    <Form.Item
                        name="phone"
                        label="Phone Number"
                        rules={[{ required: true, message: 'Please enter your phone number!' }]}
                        style={{ flex: 1 }}
                    >
                        <Input placeholder="123 456 7890" />
                    </Form.Item>
                </div>

                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: 'Please enter your email!' },
                        { type: 'email', message: 'Invalid email address!' }
                    ]}
                >
                    <Input placeholder="example@domain.com" />
                </Form.Item>

                <Form.Item
                    name="message"
                    label="Message Content"
                    rules={[{ required: true, message: 'Please enter your message!' }]}
                >
                    <TextArea rows={5} placeholder="Enter your question or support request..." />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" icon={<SendOutlined />} block style={{ height: 48, borderRadius: 8 }}>
                        Send Request
                    </Button>
                </Form.Item>
            </Form>
        </motion.div>
    );
};
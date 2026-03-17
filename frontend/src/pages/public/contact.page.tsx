import { Row, Col } from 'antd';
import { ContactForm } from '../../components/public/contact.form';
import { ContactInfo } from '../../components/public/contact.info';
import { motion } from 'framer-motion';

const ContactPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ padding: '80px 20px', background: '#fafafa', minHeight: 'calc(100vh - 64px)' }}
        >
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[48, 48]}>
                    <Col xs={24} lg={12}>
                        <ContactForm />
                    </Col>
                    <Col xs={24} lg={12}>
                        <ContactInfo />
                    </Col>
                </Row>
            </div>
        </motion.div>
    );
};

export default ContactPage;
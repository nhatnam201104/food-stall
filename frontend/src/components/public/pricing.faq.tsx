import { Collapse, Typography } from 'antd';
import { motion } from 'framer-motion';

const { Title } = Typography;
const { Panel } = Collapse;

export const PricingFAQ = () => {
    return (
        <div style={{ padding: '80px 20px', background: '#fafafa' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Title level={2}>Frequently Asked Questions</Title>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <Collapse accordion bordered={false} style={{ background: 'transparent' }}>
                        <Panel header="Can I try the Professional plan?" key="1" style={{ marginBottom: 16, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                            <p style={{ paddingLeft: 24, margin: 0, color: '#555' }}>
                                Yes! We offer a 14-day free trial of the full-featured Professional plan. After 14 days, you can decide to upgrade or automatically downgrade to the Basic plan without losing data.
                            </p>
                        </Panel>
                        <Panel header="What if I have more than 100 stores?" key="2" style={{ marginBottom: 16, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                            <p style={{ paddingLeft: 24, margin: 0, color: '#555' }}>
                                Contact us to get a quote for the Enterprise plan. This plan is custom-designed with a special rate and custom features suited for large scales.
                            </p>
                        </Panel>
                        <Panel header="Does the system support mobile apps?" key="3" style={{ marginBottom: 16, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                            <p style={{ paddingLeft: 24, margin: 0, color: '#555' }}>
                                Absolutely. We have a dedicated App for counter staff, helping to update sales status and GPS positioning easily right on a smartphone.
                            </p>
                        </Panel>
                        <Panel header="What are the payment methods?" key="4" style={{ marginBottom: 16, background: '#fff', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                            <p style={{ paddingLeft: 24, margin: 0, color: '#555' }}>
                                We support payment via Credit/Debit Cards (Visa, Mastercard), E-wallets like Momo, ZaloPay, and domestic bank transfers.
                            </p>
                        </Panel>
                    </Collapse>
                </motion.div>
            </div>
        </div>
    );
};
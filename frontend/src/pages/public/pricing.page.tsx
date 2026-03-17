import { PricingPlans } from '../../components/public/pricing.plans';
import { PricingFAQ } from '../../components/public/pricing.faq';
import { motion } from 'framer-motion';

const PricingPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <PricingPlans />
            <PricingFAQ />
        </motion.div>
    );
};

export default PricingPage;
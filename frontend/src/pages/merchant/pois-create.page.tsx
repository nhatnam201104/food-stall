import { Card } from 'antd';
import MerchantPoiCreate from '../../components/merchant/poi/create/poi.create';
import { PageContainer } from '../../components/shared';

const MerchantPoisCreatePage = () => (
  <PageContainer title="Create POI" subtitle="Create a new point of interest as a dedicated flow">
    <Card title="Create POI Form" style={{ border: '1px solid #e9edf8' }}>
      <MerchantPoiCreate />
    </Card>
  </PageContainer>
);

export default MerchantPoisCreatePage;

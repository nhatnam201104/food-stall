import { Card } from 'antd';
import MerchantPoiCreate from '../../components/merchant/poi/create/poi.create';
import { PageContainer } from '../../components/shared';

const MerchantPoisCreatePage = () => (
  <PageContainer title="Create POI" subtitle="Create a new point of interest as a dedicated flow">
    <Card title="Create POI Form" style={{ border: '1px solid #e9edf8' }}>
      <MerchantPoiCreate />
      <div style={{ marginTop: 12, border: '1px dashed #d9d9d9', borderRadius: 8, minHeight: 120, display: 'grid', placeItems: 'center' }}>
        Map Placeholder
      </div>
    </Card>
  </PageContainer>
);

export default MerchantPoisCreatePage;

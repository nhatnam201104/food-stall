import { Navigate, useParams } from 'react-router-dom';
import MerchantPoiEditForm from '../../components/merchant/poi/edit/poi.edit-form';
import { PageContainer } from '../../components/shared';
import { ROUTES } from '../../constants';

const MerchantPoisEditPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to={ROUTES.merchant.pois} replace />;
  }

  return (
    <PageContainer
      title="Edit POI"
      subtitle="Dedicated editing workspace with clear status visibility and review actions"
    >
      <MerchantPoiEditForm poiId={id} />
    </PageContainer>
  );
};

export default MerchantPoisEditPage;

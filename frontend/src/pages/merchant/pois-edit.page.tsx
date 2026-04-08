import { Navigate, useParams } from 'react-router-dom';
import MerchantPoiEdit from '../../components/merchant/poi/edit/poi.edit';
import { ROUTES } from '../../constants';
import { PageContainer } from '../../components/shared';

const MerchantPoisEditPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to={ROUTES.merchant.pois} replace />;
  }

  return (
    <PageContainer
      title="Edit POI"
      subtitle="Update your POI information in a dedicated full-page editor"
    >
      <MerchantPoiEdit poiId={id} />
    </PageContainer>
  );
};

export default MerchantPoisEditPage;

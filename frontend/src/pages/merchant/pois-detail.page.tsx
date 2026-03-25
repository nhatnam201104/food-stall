import { Navigate, useParams } from 'react-router-dom';
import MerchantPoiDetail from '../../components/merchant/poi/poi.detail';
import { ROUTES } from '../../constants';

const MerchantPoisDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to={ROUTES.merchant.pois} replace />;
  }

  return <MerchantPoiDetail poiId={id} />;
};

export default MerchantPoisDetailPage;

import { Navigate, useParams } from 'react-router-dom';
import AdminPoiDetail from '../../components/admin/poi/poi.detail';
import { ROUTES } from '../../constants';

const AdminPoisDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to={ROUTES.admin.pois} replace />;
  }

  return <AdminPoiDetail poiId={id} />;
};

export default AdminPoisDetailPage;

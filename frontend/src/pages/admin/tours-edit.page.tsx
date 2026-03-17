import { Navigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../constants';
import TourForm from '../../components/admin/tour/tour.form';

const AdminToursEditPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to={ROUTES.admin.tours} replace />;
  }

  return <TourForm mode="edit" tourId={id} />;
};

export default AdminToursEditPage;

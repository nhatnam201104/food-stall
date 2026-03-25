import { Card } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '../../../../constants';
import { adminPoiService } from '../../../../services/admin/poi.service';
import type { PointOfInterest } from '../../../../types';
import { PageContainer, PoiMap } from '../../../shared';

const AdminPoiMap = () => {
  const navigate = useNavigate();
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPois = async () => {
    setLoading(true);
    try {
      const res = await adminPoiService.map();
      setPois(res.data.data || []);
    } catch {
      toast.error('Failed to load POIs on map');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPois();
  }, []);

  const onSelectPoi = (poi: PointOfInterest) => {
    navigate(`${ROUTES.admin.pois}/${poi.id}`);
  };

  return (
    <PageContainer title="Admin POI Map" subtitle="Review all POIs by location and moderation status">
      <Card loading={loading} bodyStyle={{ padding: 12 }}>
        <PoiMap pois={pois} height={620} onMarkerClick={onSelectPoi} />
      </Card>
    </PageContainer>
  );
};

export default AdminPoiMap;

import { Card } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '../../../../constants';
import { merchantPoiService } from '../../../../services/merchant/poi.service';
import type { PointOfInterest } from '../../../../types';
import { PageContainer, PoiMap } from '../../../shared';

const MerchantPoiMap = () => {
  const navigate = useNavigate();
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [loading, setLoading] = useState(false);

  const onSelectPoi = (poi: PointOfInterest) => {
    navigate(`${ROUTES.merchant.pois}/${poi.id}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await merchantPoiService.map();
        setPois(res.data.data || []);
      } catch {
        toast.error('Failed to load map POIs');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <PageContainer
      title="My POI Map"
      subtitle="Full-screen map view of all POIs owned by your merchant account"
    >
      <Card loading={loading} bodyStyle={{ padding: 12 }}>
        <PoiMap pois={pois} height={620} onMarkerClick={onSelectPoi} />
      </Card>
    </PageContainer>
  );
};

export default MerchantPoiMap;

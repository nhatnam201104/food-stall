import { Card, Select, Space } from 'antd';
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
  const [approvalStatus, setApprovalStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');

  const fetchPois = async () => {
    setLoading(true);
    try {
      const res = await adminPoiService.map({
        approvalStatus: approvalStatus === 'all' ? undefined : approvalStatus,
        isActive: activeFilter === 'all' ? undefined : activeFilter,
      });
      setPois(res.data.data || []);
    } catch {
      toast.error('Failed to load POIs on map');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPois();
  }, [approvalStatus, activeFilter]);

  const onSelectPoi = (poi: PointOfInterest) => {
    navigate(`${ROUTES.admin.pois}/${poi.id}`);
  };

  return (
    <PageContainer title="Admin POI Map" subtitle="Review all POIs by location and moderation status">
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          value={approvalStatus}
          style={{ width: 180 }}
          onChange={setApprovalStatus}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <Select
          value={activeFilter}
          style={{ width: 180 }}
          onChange={setActiveFilter}
          options={[
            { value: 'all', label: 'All active statuses' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
      </Space>
      <Card loading={loading} bodyStyle={{ padding: 12 }}>
        <PoiMap pois={pois} height={620} onMarkerClick={onSelectPoi} />
      </Card>
    </PageContainer>
  );
};

export default AdminPoiMap;

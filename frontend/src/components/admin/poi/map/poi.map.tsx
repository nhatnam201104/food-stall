import { Button, Card, Drawer, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getPoiLanguageLabel } from '../../../../constants';
import { adminPoiService } from '../../../../services/admin/poi.service';
import type { PointOfInterest } from '../../../../types';
import { PageContainer, PoiAudioPreview, PoiMap, StatusBadge } from '../../../shared';

const AdminPoiMap = () => {
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const onSelectPoi = async (poi: PointOfInterest) => {
    setDetailLoading(true);
    try {
      const res = await adminPoiService.getById(poi.id);
      setSelectedPoi(res.data.data || null);
    } catch {
      toast.error('Failed to load POI detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const approve = async () => {
    if (!selectedPoi) return;
    try {
      await adminPoiService.approve(selectedPoi.id);
      toast.success('POI approved');
      fetchPois();
    } catch {
      toast.error('Failed to approve POI');
    }
  };

  return (
    <PageContainer title="Admin POI Map" subtitle="Review all POIs by location and moderation status">
      <Card loading={loading} bodyStyle={{ padding: 12 }}>
        <PoiMap pois={pois} height={620} onMarkerClick={onSelectPoi} />
      </Card>

      <Drawer title={selectedPoi?.name || 'POI detail'} open={!!selectedPoi} width={420} onClose={() => setSelectedPoi(null)} loading={detailLoading}>
        {selectedPoi && (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text type="secondary">Approval Status</Typography.Text>
            <StatusBadge value={selectedPoi.approvalStatus} />

            <Typography.Text type="secondary">Merchant</Typography.Text>
            <Typography.Text>{selectedPoi.merchant?.shopName || '-'}</Typography.Text>

            <Typography.Text type="secondary">Seller (Owner)</Typography.Text>
            <Typography.Text>{selectedPoi.merchant?.user?.fullName || '-'}</Typography.Text>
            <Typography.Text type="secondary">Seller Email / Phone</Typography.Text>
            <Typography.Text>{selectedPoi.merchant?.user?.email || '-'} / {selectedPoi.merchant?.user?.phone || '-'}</Typography.Text>

            <Typography.Text type="secondary">Merchant Contact / Address</Typography.Text>
            <Typography.Text>{selectedPoi.merchant?.contactEmail || '-'} / {selectedPoi.merchant?.address || '-'}</Typography.Text>

            <Typography.Text type="secondary">Seller Account Status</Typography.Text>
            <Typography.Text>
              {typeof selectedPoi.merchant?.user?.isActive === 'boolean'
                ? (selectedPoi.merchant.user.isActive ? 'Active' : 'Suspended')
                : '-'}
            </Typography.Text>

            <Typography.Text type="secondary">Address</Typography.Text>
            <Typography.Text>{selectedPoi.address || '-'}</Typography.Text>

            <Typography.Text type="secondary">Description</Typography.Text>
            <Typography.Text>{selectedPoi.description || '-'}</Typography.Text>

            <Typography.Text type="secondary">Audio Mode</Typography.Text>
            <Typography.Text>{selectedPoi.audioMode === 'tts' ? 'TTS' : 'Audio File'}</Typography.Text>

            <Typography.Text type="secondary">Audio Source</Typography.Text>
            <Typography.Text>
              {selectedPoi.audioMode === 'tts'
                ? (selectedPoi.poiAudio?.[0]?.ttsContent || '-')
                : (selectedPoi.poiAudio?.[0]?.audioUrl ? 'Uploaded audio available' : '-')}
            </Typography.Text>

            <Typography.Text type="secondary">Audio Language</Typography.Text>
            <Typography.Text>{getPoiLanguageLabel(selectedPoi.poiAudio?.[0]?.languageCode)}</Typography.Text>

            <PoiAudioPreview
              audioMode={selectedPoi.audioMode}
              ttsContent={selectedPoi.poiAudio?.[0]?.ttsContent}
              languageCode={selectedPoi.poiAudio?.[0]?.languageCode || 'vi'}
              audioUrl={selectedPoi.poiAudio?.[0]?.audioUrl}
            />

            <Typography.Text type="secondary">Coordinates</Typography.Text>
            <Typography.Text>{Number(selectedPoi.latitude).toFixed(6)}, {Number(selectedPoi.longitude).toFixed(6)}</Typography.Text>

            <Typography.Text type="secondary">Radius / Priority / Cooldown</Typography.Text>
            <Typography.Text>{selectedPoi.radiusMeters}m / {selectedPoi.priority} / {selectedPoi.cooldownSeconds}s</Typography.Text>

            <Typography.Text type="secondary">POI Timeline</Typography.Text>
            <Typography.Text>Created: {selectedPoi.createdAt ? new Date(selectedPoi.createdAt).toLocaleString() : '-'}</Typography.Text>
            <Typography.Text>Updated: {selectedPoi.updatedAt ? new Date(selectedPoi.updatedAt).toLocaleString() : '-'}</Typography.Text>
            <Typography.Text>Submitted: {selectedPoi.submittedAt ? new Date(selectedPoi.submittedAt).toLocaleString() : '-'}</Typography.Text>
            <Typography.Text>Reviewed: {selectedPoi.reviewedAt ? new Date(selectedPoi.reviewedAt).toLocaleString() : '-'}</Typography.Text>

            {selectedPoi.reviewer && (
              <>
                <Typography.Text type="secondary">Reviewer</Typography.Text>
                <Typography.Text>{selectedPoi.reviewer.fullName} ({selectedPoi.reviewer.email})</Typography.Text>
              </>
            )}

            {selectedPoi.imageUrl && (
              <img
                src={selectedPoi.imageUrl}
                alt={selectedPoi.name}
                style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
              />
            )}

            {selectedPoi.reviewNote && (
              <>
                <Typography.Text type="secondary">Review Note</Typography.Text>
                <Typography.Text>{selectedPoi.reviewNote}</Typography.Text>
              </>
            )}

            <Space>
              <Button type="primary" onClick={approve} disabled={selectedPoi.approvalStatus === 'approved'}>Approve</Button>
            </Space>
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default AdminPoiMap;

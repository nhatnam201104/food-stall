import { Card, Drawer, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getPoiLanguageLabel } from '../../../../constants';
import { merchantPoiService } from '../../../../services/merchant/poi.service';
import type { PointOfInterest } from '../../../../types';
import { PageContainer, PoiAudioPreview, PoiMap, StatusBadge } from '../../../shared';

const MerchantPoiMap = () => {
  const [pois, setPois] = useState<PointOfInterest[]>([]);
  const [selectedPoi, setSelectedPoi] = useState<PointOfInterest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSelectPoi = async (poi: PointOfInterest) => {
    setDetailLoading(true);
    try {
      const res = await merchantPoiService.getById(poi.id);
      setSelectedPoi(res.data.data || null);
    } catch {
      toast.error('Failed to load POI detail');
    } finally {
      setDetailLoading(false);
    }
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

      <Drawer
        title={selectedPoi?.name || 'POI Detail'}
        open={!!selectedPoi}
        width={420}
        onClose={() => setSelectedPoi(null)}
        loading={detailLoading}
      >
        {selectedPoi && (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Typography.Text type="secondary">Approval</Typography.Text>
            <StatusBadge value={selectedPoi.approvalStatus} />

            <Typography.Text type="secondary">Address</Typography.Text>
            <Typography.Text>{selectedPoi.address || '-'}</Typography.Text>

            <Typography.Text type="secondary">Description</Typography.Text>
            <Typography.Text>{selectedPoi.description || '-'}</Typography.Text>

            <Typography.Text type="secondary">Coordinates</Typography.Text>
            <Typography.Text>{Number(selectedPoi.latitude).toFixed(6)}, {Number(selectedPoi.longitude).toFixed(6)}</Typography.Text>

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

            <Typography.Text type="secondary">Radius / Priority / Cooldown</Typography.Text>
            <Typography.Text>{selectedPoi.radiusMeters}m / {selectedPoi.priority} / {selectedPoi.cooldownSeconds}s</Typography.Text>

            {selectedPoi.imageUrl && (
              <>
                <Typography.Text type="secondary">Image</Typography.Text>
                <img
                  src={selectedPoi.imageUrl}
                  alt={selectedPoi.name}
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
                />
              </>
            )}

            {selectedPoi.reviewNote && (
              <>
                <Typography.Text type="secondary">Review Note</Typography.Text>
                <Typography.Text>{selectedPoi.reviewNote}</Typography.Text>
              </>
            )}
          </Space>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default MerchantPoiMap;

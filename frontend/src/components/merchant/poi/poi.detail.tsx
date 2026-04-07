import { Button, Card, Col, Row, Space, Spin, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getPoiLanguageLabel, ROUTES } from '../../../constants';
import { merchantPoiService } from '../../../services/merchant/poi.service';
import type { PointOfInterest } from '../../../types';
import { PageContainer, PoiAudioPreview, StatusBadge } from '../../shared';

interface MerchantPoiDetailProps {
  poiId: string;
}

const MerchantPoiDetail = ({ poiId }: MerchantPoiDetailProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [poi, setPoi] = useState<PointOfInterest | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await merchantPoiService.getById(poiId);
      setPoi(res.data.data || null);
    } catch {
      toast.error('Failed to load POI detail');
      navigate(ROUTES.merchant.pois);
    } finally {
      setLoading(false);
    }
  }, [navigate, poiId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading && !poi) {
    return (
      <PageContainer title="POI Detail" subtitle="Loading point of interest details">
        <Card>
          <Spin />
        </Card>
      </PageContainer>
    );
  }

  if (!poi) {
    return (
      <PageContainer title="POI Detail" subtitle="Point of interest not found">
        <Card>
          <Button type="primary" onClick={() => navigate(ROUTES.merchant.pois)}>Back to POI management</Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={poi.name} subtitle="Full details for your point of interest">
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => navigate(-1)}>Back</Button>
        <Button onClick={fetchDetail} loading={loading}>Refresh</Button>
        <Button type="primary" onClick={() => navigate(ROUTES.merchant.pois)}>Go to management</Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="POI Information" style={{ height: '100%' }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Typography.Text type="secondary">Approval</Typography.Text>
              <StatusBadge value={poi.approvalStatus} />

              <Typography.Text type="secondary">Address</Typography.Text>
              <Typography.Text>{poi.address || '-'}</Typography.Text>

              <Typography.Text type="secondary">Description</Typography.Text>
              <Typography.Text>{poi.description || '-'}</Typography.Text>

              <Typography.Text type="secondary">Coordinates</Typography.Text>
              <Typography.Text>{Number(poi.latitude).toFixed(6)}, {Number(poi.longitude).toFixed(6)}</Typography.Text>

              <Typography.Text type="secondary">Radius / Priority / Cooldown</Typography.Text>
              <Typography.Text>{poi.radiusMeters}m / {poi.priority} / {poi.cooldownSeconds}s</Typography.Text>

              <Typography.Text type="secondary">Audio Mode</Typography.Text>
              <Typography.Text>{poi.audioMode === 'tts' ? 'TTS' : 'Audio File'}</Typography.Text>

              <Typography.Text type="secondary">Audio Source</Typography.Text>
              <Typography.Text>
                {poi.audioMode === 'tts'
                  ? (poi.poiAudio?.[0]?.ttsContent || '-')
                  : (poi.poiAudio?.[0]?.audioUrl ? 'Uploaded audio available' : '-')}
              </Typography.Text>

              <Typography.Text type="secondary">Audio Language</Typography.Text>
              <Typography.Text>{getPoiLanguageLabel(poi.poiAudio?.[0]?.languageCode)}</Typography.Text>

              <PoiAudioPreview
                audioMode={poi.audioMode}
                ttsContent={poi.poiAudio?.[0]?.ttsContent}
                languageCode={poi.poiAudio?.[0]?.languageCode || 'vi'}
                audioUrl={poi.poiAudio?.[0]?.audioUrl}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card title="Timeline">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text>Created: {poi.createdAt ? new Date(poi.createdAt).toLocaleString() : '-'}</Typography.Text>
                <Typography.Text>Updated: {poi.updatedAt ? new Date(poi.updatedAt).toLocaleString() : '-'}</Typography.Text>
                <Typography.Text>Submitted: {poi.submittedAt ? new Date(poi.submittedAt).toLocaleString() : '-'}</Typography.Text>
                <Typography.Text>Reviewed: {poi.reviewedAt ? new Date(poi.reviewedAt).toLocaleString() : '-'}</Typography.Text>
              </Space>
            </Card>

            {poi.imageUrl && (
              <Card title="POI Image">
                <img
                  src={poi.imageUrl}
                  alt={poi.name}
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
                />
              </Card>
            )}

            {poi.qrCodeUrl && (
              <Card title="POI QR Code">
                <img
                  src={poi.qrCodeUrl}
                  alt={`${poi.name} QR code`}
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
                />
              </Card>
            )}

            {poi.reviewNote && (
              <Card title="Review Note">
                <Typography.Text>{poi.reviewNote}</Typography.Text>
              </Card>
            )}
          </Space>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default MerchantPoiDetail;

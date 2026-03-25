import { Button, Card, Col, Input, Modal, Row, Space, Spin, Switch, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getPoiLanguageLabel, ROUTES } from '../../../constants';
import { adminPoiService } from '../../../services/admin/poi.service';
import type { PointOfInterest } from '../../../types';
import { PageContainer, PoiAudioPreview, StatusBadge } from '../../shared';

interface AdminPoiDetailProps {
  poiId: string;
}

const AdminPoiDetail = ({ poiId }: AdminPoiDetailProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [poi, setPoi] = useState<PointOfInterest | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminPoiService.getById(poiId);
      setPoi(res.data.data || null);
    } catch {
      toast.error('Failed to load POI detail');
      navigate(ROUTES.admin.pois);
    } finally {
      setLoading(false);
    }
  }, [navigate, poiId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onApprove = async () => {
    if (!poi) return;

    try {
      await adminPoiService.approve(poi.id);
      toast.success('POI approved');
      fetchDetail();
    } catch {
      toast.error('Failed to approve POI');
    }
  };

  const onReject = async () => {
    if (!poi) return;

    let reviewNote = '';
    Modal.confirm({
      title: 'Reject this POI?',
      content: (
        <Input.TextArea
          autoSize={{ minRows: 3 }}
          placeholder="Enter rejection reason"
          onChange={(event) => {
            reviewNote = event.target.value;
          }}
        />
      ),
      onOk: async () => {
        if (!reviewNote.trim()) {
          toast.error('Rejection reason is required');
          throw new Error('review note required');
        }

        await adminPoiService.reject(poi.id, reviewNote.trim());
        toast.success('POI rejected');
        fetchDetail();
      },
    });
  };

  const onToggleActive = async (checked: boolean) => {
    if (!poi) return;

    try {
      await adminPoiService.updateActive(poi.id, checked);
      toast.success('POI active status updated');
      fetchDetail();
    } catch {
      toast.error('Failed to update active status');
    }
  };

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
          <Button type="primary" onClick={() => navigate(ROUTES.admin.pois)}>Back to POI management</Button>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={poi.name} subtitle="Moderation and full POI information">
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => navigate(-1)}>Back</Button>
        <Button onClick={fetchDetail} loading={loading}>Refresh</Button>
        <Button type="primary" onClick={onApprove} disabled={poi.approvalStatus === 'approved'}>Approve</Button>
        <Button danger onClick={onReject} disabled={poi.approvalStatus === 'rejected'}>Reject</Button>
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

              <Space>
                <Typography.Text>Active</Typography.Text>
                <Switch checked={poi.isActive} onChange={onToggleActive} />
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card title="Merchant & Reviewer">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text type="secondary">Merchant</Typography.Text>
                <Typography.Text>{poi.merchant?.shopName || '-'}</Typography.Text>

                <Typography.Text type="secondary">Seller (Owner)</Typography.Text>
                <Typography.Text>{poi.merchant?.user?.fullName || '-'}</Typography.Text>

                <Typography.Text type="secondary">Seller Email / Phone</Typography.Text>
                <Typography.Text>{poi.merchant?.user?.email || '-'} / {poi.merchant?.user?.phone || '-'}</Typography.Text>

                <Typography.Text type="secondary">Merchant Contact / Address</Typography.Text>
                <Typography.Text>{poi.merchant?.contactEmail || '-'} / {poi.merchant?.address || '-'}</Typography.Text>

                <Typography.Text type="secondary">Seller Account Status</Typography.Text>
                <Typography.Text>
                  {typeof poi.merchant?.user?.isActive === 'boolean'
                    ? (poi.merchant.user.isActive ? 'Active' : 'Suspended')
                    : '-'}
                </Typography.Text>

                {poi.reviewer && (
                  <>
                    <Typography.Text type="secondary">Reviewer</Typography.Text>
                    <Typography.Text>{poi.reviewer.fullName} ({poi.reviewer.email})</Typography.Text>
                  </>
                )}
              </Space>
            </Card>

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

export default AdminPoiDetail;

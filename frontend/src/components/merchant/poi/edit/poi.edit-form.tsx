import { Alert, Button, Card, Form, Input, InputNumber, Select, Space, Spin, Typography, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '../../../../constants';
import { merchantPoiService } from '../../../../services/merchant/poi.service';
import { uploadService } from '../../../../services/upload.service';
import type { PointOfInterest } from '../../../../types';
import { PoiAudioPreview, PoiMap, StatusBadge } from '../../../shared';

interface MerchantPoiEditFormProps {
  poiId: string;
}

const MerchantPoiEditForm = ({ poiId }: MerchantPoiEditFormProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resubmitting, setResubmitting] = useState(false);
  const [poi, setPoi] = useState<PointOfInterest | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editPosition, setEditPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchPoi = useCallback(async () => {
    setLoading(true);
    try {
      const response = await merchantPoiService.getById(poiId);
      const detail = response.data.data;
      if (!detail) {
        toast.error('POI not found');
        navigate(ROUTES.merchant.pois);
        return;
      }

      setPoi(detail);
      setEditImageFile(null);
      setEditPosition({ latitude: Number(detail.latitude), longitude: Number(detail.longitude) });
      form.setFieldsValue({
        name: detail.name,
        description: detail.description,
        address: detail.address,
        latitude: Number(detail.latitude),
        longitude: Number(detail.longitude),
        audioMode: 'tts',
        ttsContent: detail.poiAudio?.[0]?.ttsContent || detail.description || detail.name || undefined,
        isActive: detail.isActive,
      });
    } catch {
      toast.error('Failed to load POI detail');
      navigate(ROUTES.merchant.pois);
    } finally {
      setLoading(false);
    }
  }, [form, navigate, poiId]);

  useEffect(() => {
    fetchPoi();
  }, [fetchPoi]);

  const beforeEditUpload: UploadProps['beforeUpload'] = (file) => {
    setEditImageFile(file as File);
    return false;
  };

  const onSave = async () => {
    if (!poi) return;

    try {
      setSaving(true);
      const values = await form.validateFields();

      let nextImageUrl: string | undefined;

      if (editImageFile) {
        const uploadRes = await uploadService.uploadImage(editImageFile);
        nextImageUrl = uploadRes.data?.url;
      }

      await merchantPoiService.update(poi.id, {
        name: values.name,
        description: values.description,
        address: values.address,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        audioMode: 'tts',
        ttsContent: values.ttsContent,
        isActive: !!values.isActive,
        ...(nextImageUrl ? { imageUrl: nextImageUrl } : {}),
      });

      toast.success('POI updated successfully');
      navigate(`${ROUTES.merchant.pois}/${poi.id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to update POI');
    } finally {
      setSaving(false);
    }
  };

  const onResubmit = async () => {
    if (!poi) return;

    try {
      setResubmitting(true);
      await merchantPoiService.resubmit(poi.id);
      toast.success('POI resubmitted for admin review');
      await fetchPoi();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      toast.error(axiosErr.response?.data?.message || 'Failed to resubmit POI');
    } finally {
      setResubmitting(false);
    }
  };

  if (loading || !poi) {
    return (
      <Card>
        <Space align="center">
          <Spin size="small" />
          <Typography.Text>Loading POI edit form...</Typography.Text>
        </Space>
      </Card>
    );
  }

  const isRejected = poi.approvalStatus === 'rejected';

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space>
            <Typography.Text strong>Status:</Typography.Text>
            <StatusBadge value={poi.approvalStatus} />
          </Space>
          {isRejected && (
            <Alert
              type="warning"
              showIcon
              message="POI is currently rejected"
              description={poi.reviewNote || 'No review note provided by admin.'}
            />
          )}
        </Space>
      </Card>

      <Card title={`Edit POI: ${poi.name}`}>
        <Form form={form} layout="vertical">
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'POI name is required' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Address is required' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="audioMode" hidden>
            <Input />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item label="Latitude" name="latitude" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Longitude" name="longitude" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item
            label="TTS Content"
            name="ttsContent"
            rules={[{ required: true, message: 'TTS content is required' }]}
          >
            <Input.TextArea rows={5} autoSize={{ minRows: 5, maxRows: 14 }} showCount placeholder="Enter text to convert to speech" />
          </Form.Item>

          <PoiAudioPreview
            audioMode="tts"
            ttsContent={form.getFieldValue('ttsContent')}
            languageCode="vi"
          />

          <Form.Item label="Active" name="isActive">
            <Select options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]} />
          </Form.Item>

          <Form.Item label="Image">
            <Space direction="vertical" style={{ width: '100%' }}>
              {poi.imageUrl && !editImageFile && (
                <a href={poi.imageUrl} target="_blank" rel="noreferrer">Current image</a>
              )}
              <Upload
                beforeUpload={beforeEditUpload}
                maxCount={1}
                accept="image/*"
                fileList={editImageFile ? ([{ uid: 'edit-image', name: editImageFile.name, status: 'done' } as UploadFile]) : []}
              >
                <Button>Choose new image</Button>
              </Upload>
            </Space>
          </Form.Item>

          <Form.Item label="Pick position on map">
            <PoiMap
              height={320}
              selectedPosition={editPosition}
              onPickPosition={(latitude, longitude) => {
                setEditPosition({ latitude, longitude });
                form.setFieldsValue({ latitude, longitude });
              }}
            />
          </Form.Item>

          <Space wrap>
            <Button onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={fetchPoi} loading={loading}>Reload</Button>
            {isRejected && (
              <Button loading={resubmitting} onClick={onResubmit}>
                Resubmit for Review
              </Button>
            )}
            <Button type="primary" loading={saving} onClick={onSave}>
              Save Changes
            </Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
};

export default MerchantPoiEditForm;

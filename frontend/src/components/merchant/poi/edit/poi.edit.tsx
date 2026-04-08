import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Spin, Typography, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '../../../../constants';
import { merchantPoiService } from '../../../../services/merchant/poi.service';
import { uploadService } from '../../../../services/upload.service';
import type { PointOfInterest } from '../../../../types';
import { PoiAudioPreview, PoiMap } from '../../../shared';

interface MerchantPoiEditProps {
  poiId: string;
}

const MerchantPoiEdit = ({ poiId }: MerchantPoiEditProps) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [poi, setPoi] = useState<PointOfInterest | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [pickedPosition, setPickedPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await merchantPoiService.getById(poiId);
      const nextPoi = res.data.data || null;
      if (!nextPoi) {
        toast.error('POI not found');
        navigate(ROUTES.merchant.pois, { replace: true });
        return;
      }

      setPoi(nextPoi);
      setPickedPosition({
        latitude: Number(nextPoi.latitude),
        longitude: Number(nextPoi.longitude),
      });

      const currentAudio = nextPoi.poiAudio?.[0];
      form.setFieldsValue({
        name: nextPoi.name,
        description: nextPoi.description,
        address: nextPoi.address,
        latitude: Number(nextPoi.latitude),
        longitude: Number(nextPoi.longitude),
        audioMode: nextPoi.audioMode,
        ttsContent: currentAudio?.ttsContent || undefined,
        isActive: nextPoi.isActive,
      });
    } catch {
      toast.error('Failed to load POI detail');
      navigate(ROUTES.merchant.pois, { replace: true });
    } finally {
      setLoading(false);
    }
  }, [form, navigate, poiId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const beforeImageUpload: UploadProps['beforeUpload'] = (file) => {
    setImageFile(file as File);
    return false;
  };

  const beforeAudioUpload: UploadProps['beforeUpload'] = (file) => {
    setAudioFile(file as File);
    return false;
  };

  const onSubmit = async () => {
    if (!poi) return;

    try {
      const values = await form.validateFields();
      setSaving(true);

      let nextImageUrl: string | undefined;
      let nextAudioUrl: string | undefined;
      const currentAudio = poi.poiAudio?.[0];

      if (values.audioMode === 'file') {
        if (audioFile) {
          const uploadAudioRes = await uploadService.uploadAudio(audioFile);
          nextAudioUrl = uploadAudioRes.data?.url;
        } else if (currentAudio?.audioUrl) {
          nextAudioUrl = currentAudio.audioUrl;
        } else {
          toast.error('Please upload an audio file when audio mode is File');
          setSaving(false);
          return;
        }
      }

      if (imageFile) {
        const uploadRes = await uploadService.uploadImage(imageFile);
        nextImageUrl = uploadRes.data?.url;
      }

      await merchantPoiService.update(poi.id, {
        name: values.name,
        description: values.description,
        address: values.address,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        audioMode: values.audioMode,
        ttsContent: values.audioMode === 'tts' ? values.ttsContent : undefined,
        audioUrl: values.audioMode === 'file' ? nextAudioUrl : undefined,
        isActive: Boolean(values.isActive),
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

  if (loading && !poi) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!poi) {
    return (
      <Card>
        <Typography.Text type="secondary">POI not found.</Typography.Text>
      </Card>
    );
  }

  return (
    <Card
      title={`Edit POI: ${poi.name}`}
      extra={(
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={fetchDetail} loading={loading}>Reload</Button>
        </Space>
      )}
      style={{ border: '1px solid #e9edf8' }}
    >
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}> 
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Address" name="address" rules={[{ required: true, message: 'Address is required' }]}> 
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Latitude" name="latitude" rules={[{ required: true }]}> 
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Longitude" name="longitude" rules={[{ required: true }]}> 
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Audio Mode" name="audioMode" rules={[{ required: true, message: 'Audio mode is required' }]}> 
              <Select options={[{ value: 'tts', label: 'TTS (Text to Speech)' }, { value: 'file', label: 'Audio File' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Active" name="isActive" rules={[{ required: true }]}> 
              <Select options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item shouldUpdate noStyle>
          {() => (
            <>
              {form.getFieldValue('audioMode') === 'tts' && (
                <>
                  <Form.Item
                    label="TTS Content"
                    name="ttsContent"
                    rules={[{ required: true, message: 'TTS content is required in TTS mode' }]}
                  >
                    <Input.TextArea rows={5} placeholder="Enter text to convert to speech" />
                  </Form.Item>
                  <Form.Item shouldUpdate noStyle>
                    {() => (
                      <PoiAudioPreview
                        audioMode="tts"
                        ttsContent={form.getFieldValue('ttsContent')}
                        languageCode="vi"
                      />
                    )}
                  </Form.Item>
                </>
              )}

              {form.getFieldValue('audioMode') === 'file' && (
                <>
                  <Form.Item label="Audio File" required>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {poi.poiAudio?.[0]?.audioUrl && !audioFile && (
                        <a href={poi.poiAudio[0].audioUrl} target="_blank" rel="noreferrer">Current audio</a>
                      )}
                      <Upload
                        beforeUpload={beforeAudioUpload}
                        maxCount={1}
                        accept="audio/*"
                        fileList={audioFile ? ([{ uid: 'edit-audio', name: audioFile.name, status: 'done' } as UploadFile]) : []}
                      >
                        <Button>Choose new audio</Button>
                      </Upload>
                    </Space>
                  </Form.Item>
                  <PoiAudioPreview
                    audioMode="file"
                    audioUrl={poi.poiAudio?.[0]?.audioUrl}
                    localAudioFile={audioFile}
                  />
                </>
              )}
            </>
          )}
        </Form.Item>

        <Form.Item label="Image">
          <Space direction="vertical" style={{ width: '100%' }}>
            {poi.imageUrl && !imageFile && (
              <a href={poi.imageUrl} target="_blank" rel="noreferrer">Current image</a>
            )}
            <Upload
              beforeUpload={beforeImageUpload}
              maxCount={1}
              accept="image/*"
              fileList={imageFile ? ([{ uid: 'edit-image', name: imageFile.name, status: 'done' } as UploadFile]) : []}
            >
              <Button>Choose new image</Button>
            </Upload>
          </Space>
        </Form.Item>

        <Form.Item label="Pick position on map">
          <PoiMap
            height={360}
            selectedPosition={pickedPosition}
            onPickPosition={(latitude, longitude) => {
              setPickedPosition({ latitude, longitude });
              form.setFieldsValue({ latitude, longitude });
            }}
          />
        </Form.Item>

        <Space>
          <Button onClick={() => navigate(`${ROUTES.merchant.pois}/${poi.id}`)}>Cancel</Button>
          <Button type="primary" loading={saving} onClick={onSubmit}>Save changes</Button>
        </Space>
      </Form>
    </Card>
  );
};

export default MerchantPoiEdit;

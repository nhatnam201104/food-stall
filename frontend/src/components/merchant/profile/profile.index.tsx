import { App, Avatar, Button, Card, Col, Form, Input, Row, Space, Typography, Upload } from 'antd';
import { useEffect, useState } from 'react';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../stores/auth.store';
import { PageContainer } from '../../shared';
import { uploadService } from '../../../services/upload.service';
import { resolveMediaUrl } from '../../../utils/media.util';
import { normalizeVietnamPhoneInput, toVietnamPhoneE164, toVietnamPhoneInputValue } from '../../../utils/phone.util';

const MerchantProfile = () => {
  const { message } = App.useApp();
  const { user, updateProfile, isLoading } = useAuthStore();
  const [form] = Form.useForm();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarTouched, setAvatarTouched] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        fullName: user.fullName,
        email: user.email,
        phone: toVietnamPhoneInputValue(user.phone),
        shopName: user.merchant?.shopName ?? '',
        address: user.merchant?.address ?? '',
        contactEmail: user.merchant?.contactEmail ?? '',
      });
      setAvatarPreview(resolveMediaUrl(user.avatarUrl) ?? null);
      setAvatarFile(null);
      setAvatarTouched(false);
    }
  }, [user, form]);

  const onFinish = async (values: {
    fullName: string;
    phone?: string;
    shopName?: string;
    address?: string;
    contactEmail?: string;
  }) => {
    let avatarUrl: string | null | undefined;

    if (avatarTouched) {
      if (avatarFile) {
        try {
          const { data } = await uploadService.uploadImage(avatarFile);
          avatarUrl = data?.url ?? null;
        } catch {
          message.error('Failed to upload avatar. Please try again.');
          return;
        }
      } else {
        avatarUrl = null;
      }
    }

    const ok = await updateProfile({
      fullName: values.fullName,
      phone: toVietnamPhoneE164(values.phone),
      shopName: values.shopName?.trim() || undefined,
      address: values.address?.trim() || undefined,
      contactEmail: values.contactEmail?.trim() || undefined,
      avatarUrl,
    });

    if (ok) {
      message.success('Profile updated successfully!');
      setAvatarFile(null);
      setAvatarTouched(false);
    } else {
      message.error('Failed to update profile. Please try again.');
    }
  };

  const handleBeforeUpload = (file: File) => {
    setAvatarFile(file);
    setAvatarTouched(true);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    return false;
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarTouched(true);
  };

  return (
    <PageContainer title="Merchant Profile" subtitle="Shop and owner information">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card title="Avatar">
          <Space align="center" size={16}>
            <Avatar size={80} src={avatarPreview || resolveMediaUrl(user?.avatarUrl)} icon={<UserOutlined />} />
            <Upload showUploadList={false} accept="image/*" beforeUpload={handleBeforeUpload}>
              <Button icon={<UploadOutlined />}>Change Avatar</Button>
            </Upload>
            {(avatarFile || avatarPreview) && (
              <Button danger type="link" onClick={removeAvatar}>
                Remove Avatar
              </Button>
            )}
          </Space>
        </Card>

        <Card title="Profile Information & Shop Settings">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Required' }]}> 
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Email" name="email">
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Phone"
                  name="phone"
                  getValueFromEvent={(e) => normalizeVietnamPhoneInput(e?.target?.value)}
                  rules={[
                    {
                      validator: (_, value?: string) => {
                        if (!value) return Promise.resolve();
                        if (/^\d{9,10}$/.test(value)) return Promise.resolve();
                        return Promise.reject(new Error('Phone must contain 9-10 valid digits.'));
                      },
                    },
                  ]}
                >
                  <Input addonBefore="+84" maxLength={10} placeholder="Enter phone digits" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Shop Name" name="shopName" rules={[{ required: true, message: 'Required' }]}> 
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Contact Email" name="contactEmail" rules={[{ type: 'email', message: 'Invalid email' }]}> 
                  <Input placeholder="Optional, defaults to owner email" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Address" name="address">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Button type="primary" htmlType="submit" loading={isLoading}>
              Save Changes
            </Button>
          </Form>
        </Card>

        {user?.merchant && (
          <Card title="Shop Information">
            <Typography.Text><strong>Account Status:</strong> {user.isActive ? 'Active' : 'Suspended'}</Typography.Text>
            <br />
            <Typography.Text type="secondary">
              Shop details are now editable in the form above and synced with your merchant profile.
            </Typography.Text>
            <Typography.Text type="secondary">
              {' '}
            </Typography.Text>
          </Card>
        )}
      </Space>
    </PageContainer>
  );
};

export default MerchantProfile;

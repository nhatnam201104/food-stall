import { Col, Form, Input, Modal, Row, Upload, Avatar } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { toast } from 'sonner';
import type { UploadFile } from 'antd/es/upload';
import { merchantService } from '../../../services/admin/merchant.service';
import type { CreateMerchantPayload } from '../../../services/admin/merchant.service';
import { uploadService } from '../../../services/upload.service';
import { normalizeVietnamPhoneInput, toVietnamPhoneE164 } from '../../../utils/phone.util';

interface MerchantCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MerchantCreateModal = ({ open, onClose, onSuccess }: MerchantCreateModalProps) => {
  const [form] = Form.useForm<CreateMerchantPayload>();
  const [loading, setLoading] = useState(false);
  // Store the raw file chosen by user — not uploaded yet
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Called when user picks a file — only show preview, do NOT upload yet
  const handleBeforeUpload = (file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    return false; // prevent automatic upload
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmit = async (values: CreateMerchantPayload) => {
    setLoading(true);
    try {
      let avatarUrl: string | null = null;

      // Upload avatar only at form submission time if user selected a file
      if (avatarFile) {
        try {
          const { data } = await uploadService.uploadImage(avatarFile);
          avatarUrl = data?.url || null;
        } catch {
          toast.error('Failed to upload avatar. Please try again.');
          setLoading(false);
          return;
        }
      }

      const normalizedPhone = toVietnamPhoneE164(values.phone);

      await merchantService.create({
        ...values,
        phone: normalizedPhone,
        avatarUrl,
      });
      toast.success('Merchant created successfully!');

      // Reset form and close dialog on success
      form.resetFields();
      handleRemoveAvatar();
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: { field: string; message: string }[] } } };

      if (axiosErr.response?.data?.errors?.length) {
        // Show each backend validation error as a separate toast
        axiosErr.response.data.errors.forEach(e => {
          toast.error(e.message);
        });
        // Map server errors to form fields for inline feedback
        const formErrors = axiosErr.response.data.errors.map(e => ({
          name: e.field as unknown as string,
          errors: [e.message],
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setFields(formErrors as any);
      } else {
        toast.error(axiosErr.response?.data?.message || 'Failed to create merchant');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    handleRemoveAvatar();
    onClose();
  };

  return (
    <Modal
      title="Create New Merchant"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Create Merchant"
      width={700}
      centered
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        {/* Avatar section */}
        <Row justify="center" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Avatar
              size={80}
              src={avatarPreview}
              icon={!avatarPreview ? <UserOutlined /> : undefined}
              style={{ background: '#e6f0ff' }}
            />
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={handleBeforeUpload}
              fileList={avatarFile ? [{ uid: '-1', name: avatarFile.name, status: 'done' } as UploadFile] : []}
            >
              <a style={{ fontSize: 13, color: '#1677ff', cursor: 'pointer' }}>
                <UploadOutlined style={{ marginRight: 4 }} />
                {avatarFile ? 'Change Avatar' : 'Upload Avatar (Optional)'}
              </a>
            </Upload>
            {avatarFile && (
              <a style={{ fontSize: 12, color: '#ff4d4f', cursor: 'pointer' }} onClick={handleRemoveAvatar}>
                Remove
              </a>
            )}
          </div>
        </Row>

        <Row gutter={16}>
          {/* Column 1: Owner Info */}
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#1677ff' }}>Owner Information</div>
            <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Full name is required' }]}>
              <Input placeholder="e.g. Nguyễn Văn A" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
              <Input placeholder="merchant@example.com" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true, min: 8, message: 'Min 8 characters' }]}>
              <Input.Password placeholder="At least 8 characters" />
            </Form.Item>
            <Form.Item
              label="Phone"
              name="phone"
              extra="Mặc định mã quốc gia +84. Nếu nhập 0 ở đầu, hệ thống sẽ tự bỏ số 0."
              getValueFromEvent={(e) => normalizeVietnamPhoneInput(e?.target?.value)}
              rules={[
                {
                  validator: (_, value?: string) => {
                    if (!value) return Promise.resolve();
                    if (/^\d{9,10}$/.test(value)) return Promise.resolve();
                    return Promise.reject(new Error('Số điện thoại phải gồm 9-10 chữ số hợp lệ.'));
                  },
                },
              ]}
            >
              <Input
                addonBefore="+84"
                maxLength={10}
                placeholder="Nhập số điện thoại (không cần số 0 đầu)"
              />
            </Form.Item>
          </Col>

          {/* Column 2: Shop Info */}
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#1677ff' }}>Shop Information</div>
            <Form.Item label="Shop Name" name="shopName" rules={[{ required: true, message: 'Shop name is required' }]}>
              <Input placeholder="e.g. Gian hàng ABC" />
            </Form.Item>
            <Form.Item label="Contact Email" name="contactEmail">
              <Input placeholder="Leave blank to use owner email" />
            </Form.Item>
            <Form.Item label="Address" name="address">
              <Input.TextArea rows={4} placeholder="Optional shop address" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

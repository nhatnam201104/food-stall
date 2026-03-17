import { Col, Form, Input, Modal, Row, Upload, Avatar } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { UploadFile } from 'antd/es/upload';
import { merchantService } from '../../../services/admin/merchant.service';
import type { Merchant } from '../../../types/domain.types';
import { normalizeVietnamPhoneInput, toVietnamPhoneE164, toVietnamPhoneInputValue } from '../../../utils/phone.util';
import { uploadService } from '../../../services/upload.service';
import { resolveMediaUrl } from '../../../utils/media.util';

interface MerchantUpdateModalProps {
  open: boolean;
  merchant: Merchant | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface MerchantUpdateFormValues {
  fullName?: string;
  phone?: string;
  shopName?: string;
  contactEmail?: string;
  address?: string;
}

const toOptional = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const mapMerchantToForm = (merchant: Merchant): MerchantUpdateFormValues => ({
  fullName: merchant.user?.fullName ?? '',
  phone: toVietnamPhoneInputValue(merchant.user?.phone),
  shopName: merchant.shopName,
  contactEmail: merchant.contactEmail ?? '',
  address: merchant.address ?? '',
});

const mapServerFieldToFormField = (field: string): keyof MerchantUpdateFormValues | 'phone' => {
  if (field === 'user.phone') return 'phone';
  if (field === 'user.fullName') return 'fullName';
  return field as keyof MerchantUpdateFormValues;
};

export const MerchantUpdateModal = ({ open, merchant, onClose, onSuccess }: MerchantUpdateModalProps) => {
  const [form] = Form.useForm<MerchantUpdateFormValues>();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarTouched, setAvatarTouched] = useState(false);

  useEffect(() => {
    if (!open || !merchant) return;
    form.setFieldsValue(mapMerchantToForm(merchant));
    setAvatarFile(null);
    setAvatarTouched(false);
    setAvatarPreview(resolveMediaUrl(merchant.user?.avatarUrl) ?? null);
  }, [open, merchant, form]);

  const handleBeforeUpload = (file: File) => {
    setAvatarFile(file);
    setAvatarTouched(true);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    return false;
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarTouched(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setAvatarFile(null);
    setAvatarTouched(false);
    setAvatarPreview(null);
    onClose();
  };

  const handleSubmit = async (values: MerchantUpdateFormValues) => {
    if (!merchant) return;

    setLoading(true);
    try {
      let avatarUrl: string | null | undefined;

      if (avatarTouched) {
        if (avatarFile) {
          try {
            const { data } = await uploadService.uploadImage(avatarFile);
            avatarUrl = data?.url ?? null;
          } catch {
            toast.error('Failed to upload avatar. Please try again.');
            setLoading(false);
            return;
          }
        } else {
          avatarUrl = null;
        }
      }

      const payload = {
        fullName: toOptional(values.fullName),
        phone: toVietnamPhoneE164(values.phone),
        shopName: toOptional(values.shopName),
        contactEmail: toOptional(values.contactEmail),
        address: toOptional(values.address),
        avatarUrl,
      };

      await merchantService.update(merchant.id, payload);
      toast.success('Merchant updated successfully!');

      form.resetFields();
      setAvatarFile(null);
      setAvatarTouched(false);
      setAvatarPreview(null);
      onClose();
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string; errors?: { field: string; message: string }[] } };
      };

      if (axiosErr.response?.data?.errors?.length) {
        axiosErr.response.data.errors.forEach((e) => toast.error(e.message));

        const formErrors = axiosErr.response.data.errors.map((e) => ({
          name: mapServerFieldToFormField(e.field),
          errors: [e.message],
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setFields(formErrors as any);
      } else {
        toast.error(axiosErr.response?.data?.message || 'Failed to update merchant');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Update Merchant"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Save Changes"
      width={700}
      centered
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row justify="center" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Avatar
              size={80}
              src={avatarPreview || undefined}
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
                {avatarFile ? 'Change Avatar' : 'Update Avatar'}
              </a>
            </Upload>

            {(avatarFile || avatarPreview) && (
              <a style={{ fontSize: 12, color: '#ff4d4f', cursor: 'pointer' }} onClick={handleRemoveAvatar}>
                Remove
              </a>
            )}
          </div>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#1677ff' }}>Owner Information</div>
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[{ required: true, message: 'Full name is required' }]}
            >
              <Input placeholder="e.g. Nguyễn Văn A" />
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

          <Col xs={24} md={12}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#1677ff' }}>Shop Information</div>
            <Form.Item
              label="Shop Name"
              name="shopName"
              rules={[{ required: true, message: 'Shop name is required' }]}
            >
              <Input placeholder="e.g. Gian hàng ABC" />
            </Form.Item>

            <Form.Item
              label="Contact Email"
              name="contactEmail"
              rules={[{ type: 'email', message: 'Contact email must be valid' }]}
            >
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

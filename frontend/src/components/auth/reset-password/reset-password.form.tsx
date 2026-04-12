import { Alert, Button, Form, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { authService } from '../../../services/auth.service';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async ({ newPassword, confirmNewPassword }: { newPassword: string; confirmNewPassword: string }) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword({ token, newPassword, confirmNewPassword });
      navigate(ROUTES.auth.merchantLogin, {
        replace: true,
        state: { message: 'Password reset successfully! Please login.' },
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="error"
          showIcon
          message="Invalid reset link"
          description="Please request a new password reset link."
        />
        <Link to={ROUTES.auth.forgotPassword}>Request new link</Link>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Reset Password
        </Typography.Title>
        <Typography.Text type="secondary">
          Enter your new password below.
        </Typography.Text>
      </div>

      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />}

      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
        >
          <Input.Password placeholder="At least 8 characters" />
        </Form.Item>
        <Form.Item
          label="Confirm New Password"
          name="confirmNewPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Repeat your new password" />
        </Form.Item>
        <Button htmlType="submit" type="primary" block loading={loading}>
          Reset Password
        </Button>
      </Form>

      <Typography.Text style={{ display: 'block', textAlign: 'center' }}>
        <Link to={ROUTES.auth.merchantLogin}>← Back to login</Link>
      </Typography.Text>
    </Space>
  );
};

export default ResetPasswordForm;

import { Alert, Button, Form, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { authService } from '../../../services/auth.service';

const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async ({ email }: { email: string }) => {
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword({ email });
      setSent(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="success"
          showIcon
          message="Reset link sent!"
          description="Please check your email inbox. The link is valid for 1 hour."
        />
        <Typography.Text style={{ display: 'block', textAlign: 'center' }}>
          <Link to={ROUTES.auth.merchantLogin}>← Back to login</Link>
        </Typography.Text>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Forgot Password
        </Typography.Title>
        <Typography.Text type="secondary">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </Typography.Text>
      </div>

      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError(null)} />}

      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
        >
          <Input placeholder="you@example.com" />
        </Form.Item>
        <Button htmlType="submit" type="primary" block loading={loading}>
          Send Reset Link
        </Button>
      </Form>

      <Typography.Text style={{ display: 'block', textAlign: 'center' }}>
        <Link to={ROUTES.auth.merchantLogin}>← Back to login</Link>
      </Typography.Text>
    </Space>
  );
};

export default ForgotPasswordForm;

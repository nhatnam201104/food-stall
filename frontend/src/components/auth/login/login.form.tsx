import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Divider, Form, Input, Space, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useAuthStore } from '../../../stores';
import type { LoginPayload } from '../../../types';
import { loginSchema } from '../../../validations';

const LoginForm = () => {
	const navigate = useNavigate();
	const { login, logout, isLoading, error, clearError } = useAuthStore();
	const [roleError, setRoleError] = useState<string | null>(null);
	const [searchParams] = useSearchParams();
	
	// Check expired từ 2 nguồn:
	// 1. Query param ?expired=true (từ API redirect khi 401)
	// 2. Session storage flag (từ token expiry khi load trang)
	const isExpired = searchParams.get('expired') === 'true' || sessionStorage.getItem('session_expired') === 'true';
	
	// Cleanup sau khi check
	useEffect(() => {
		if (isExpired) {
			// Xóa query param
			const url = new URL(window.location.href);
			url.searchParams.delete('expired');
			window.history.replaceState({}, '', url.pathname);
			// Xóa session storage flag
			sessionStorage.removeItem('session_expired');
		}
	}, [isExpired]);

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginPayload>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	});

	const onSubmit = async (values: LoginPayload) => {
		setRoleError(null);
		const loggedInUser = await login(values);
		if (!loggedInUser) return;
		if ((loggedInUser.role as string) !== 'admin' && (loggedInUser.role as string) !== 'merchant') {
			logout();
			setRoleError('This platform is for merchants and administrators only.');
			return;
		}
		navigate(
			loggedInUser.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.merchant.dashboard,
			{ replace: true },
		);
	};

	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			<div>
				<Typography.Title level={3} style={{ marginBottom: 4 }}>
					Welcome back
				</Typography.Title>
				<Typography.Text type="secondary">
					Sign in to your account to continue.
				</Typography.Text>
			</div>

			{error && <Alert type="error" showIcon message={error} closable onClose={clearError} />}
		{roleError && <Alert type="error" showIcon message={roleError} closable onClose={() => setRoleError(null)} />}
		{isExpired && (
			<Alert
				type="warning"
				showIcon
				message="Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
				closable
				onClose={() => {}}
			/>
		)}

			<Form layout="vertical" onFinish={handleSubmit(onSubmit)} autoComplete="off">
				<Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
					<Controller
						control={control}
						name="email"
						render={({ field }) => (
							<Input
								{...field}
								placeholder="you@example.com"
								onChange={(e) => { clearError(); field.onChange(e); }}
							/>
						)}
					/>
				</Form.Item>

				<Form.Item label="Password" validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
					<Controller
						control={control}
						name="password"
						render={({ field }) => (
							<Input.Password
								{...field}
								placeholder="Enter your password"
								onChange={(e) => { clearError(); field.onChange(e); }}
							/>
						)}
					/>
				</Form.Item>

				<div style={{ textAlign: 'right', marginBottom: 16 }}>
					<Link to={ROUTES.auth.forgotPassword}>Forgot password?</Link>
				</div>

				<Button htmlType="submit" type="primary" block loading={isLoading}>
					Sign in
				</Button>
			</Form>

			<Divider />
			<Typography.Text style={{ display: 'block', textAlign: 'center' }}>
				New merchant?{' '}
				<Link to={ROUTES.auth.merchantRegister}>Create merchant account</Link>
			</Typography.Text>
		</Space>
	);
};

export default LoginForm;

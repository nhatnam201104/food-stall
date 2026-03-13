import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Form, Input, Space, Typography } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useAuthStore } from '../../../stores';
import type { LoginPayload } from '../../../types';
import { loginSchema } from '../../../validations';

const LoginForm = () => {
	const navigate = useNavigate();
	const { login, isLoading, error, clearError } = useAuthStore();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginPayload>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const onSubmit = async (values: LoginPayload) => {
		const loggedInUser = await login(values);

		if (!loggedInUser) {
			return;
		}

		navigate(loggedInUser.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.merchant.dashboard, { replace: true });
	};

	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			<div>
				<Typography.Title level={3} style={{ marginBottom: 4 }}>
					Welcome back
				</Typography.Title>
				<Typography.Text type="secondary">
					Sign in with your account. The system automatically opens the correct dashboard by role.
				</Typography.Text>
			</div>

			{error && <Alert type="error" showIcon message={error} closable onClose={clearError} />}

			<Form layout="vertical" onFinish={handleSubmit(onSubmit)} autoComplete="off">
				<Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
					<Controller
						control={control}
						name="email"
						render={({ field }) => <Input {...field} placeholder="you@example.com" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Form.Item label="Password" validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
					<Controller
						control={control}
						name="password"
						render={({ field }) => <Input.Password {...field} placeholder="Enter password" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Button htmlType="submit" type="primary" block loading={isLoading}>
					Sign in
				</Button>
			</Form>

			<Space direction="vertical" size={4} style={{ width: '100%' }}>
				<Typography.Text type="secondary">Admin demo: admin@audiotour.local / admin123</Typography.Text>
				<Typography.Text type="secondary">Merchant demo: merchant@audiotour.local / merchant123</Typography.Text>
				<Typography.Text>
					New merchant? <Link to={ROUTES.auth.merchantRegister}>Create merchant account</Link>
				</Typography.Text>
			</Space>
		</Space>
	);
};

export default LoginForm;

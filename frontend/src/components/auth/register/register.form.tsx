import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Form, Input, Space, Typography } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useAuthStore } from '../../../stores';
import { registerSchema } from '../../../validations';
import type { RegisterSchemaValues } from '../../../validations';

const RegisterForm = () => {
	const navigate = useNavigate();
	const { registerMerchant, isLoading, error, clearError } = useAuthStore();

	const {
		control,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterSchemaValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			fullName: '',
			shopName: '',
			email: '',
			phone: '',
			address: '',
			password: '',
			confirmPassword: '',
		},
	});

	const onSubmit = async (values: RegisterSchemaValues) => {
		const success = await registerMerchant({
			fullName: values.fullName,
			shopName: values.shopName,
			email: values.email,
			phone: values.phone,
			address: values.address,
			password: values.password,
			confirmPassword: values.confirmPassword,
		});

		if (!success) {
			return;
		}

		navigate(ROUTES.auth.merchantLogin, { replace: true });
	};

	return (
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			<div>
				<Typography.Title level={3} style={{ marginBottom: 4 }}>Merchant Register</Typography.Title>
				<Typography.Text type="secondary">Create your merchant account for Audio Tour Guide.</Typography.Text>
			</div>

			{error && <Alert type="error" showIcon message={error} closable onClose={clearError} />}

			<Form layout="vertical" onFinish={handleSubmit(onSubmit)} autoComplete="off">
				<Form.Item label="Owner Name" validateStatus={errors.fullName ? 'error' : ''} help={errors.fullName?.message}>
					<Controller
						control={control}
						name="fullName"
						render={({ field }) => <Input {...field} placeholder="Nguyen Van A" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Form.Item label="Shop Name" validateStatus={errors.shopName ? 'error' : ''} help={errors.shopName?.message}>
					<Controller
						control={control}
						name="shopName"
						render={({ field }) => <Input {...field} placeholder="Sunset Coffee Booth" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
					<Controller
						control={control}
						name="email"
						render={({ field }) => <Input {...field} placeholder="merchant@audiotour.local" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Form.Item label="Phone" validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message}>
					<Controller
						control={control}
						name="phone"
						render={({ field }) => <Input {...field} placeholder="090xxxxxxx" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Form.Item label="Address" validateStatus={errors.address ? 'error' : ''} help={errors.address?.message}>
					<Controller
						control={control}
						name="address"
						render={({ field }) => <Input {...field} placeholder="123 Nguyen Hue, HCMC" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Form.Item label="Password" validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
					<Controller
						control={control}
						name="password"
						render={({ field }) => <Input.Password {...field} placeholder="Create password" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Form.Item label="Confirm Password" validateStatus={errors.confirmPassword ? 'error' : ''} help={errors.confirmPassword?.message}>
					<Controller
						control={control}
						name="confirmPassword"
						render={({ field }) => <Input.Password {...field} placeholder="Re-enter password" onChange={(event) => {
							clearError();
							field.onChange(event);
						}} />}
					/>
				</Form.Item>

				<Button htmlType="submit" type="primary" block loading={isLoading}>Create merchant account</Button>
			</Form>

			<Typography.Text>
				Already have an account? <Link to={ROUTES.auth.merchantLogin}>Go to Merchant Login</Link>
			</Typography.Text>
		</Space>
	);
};

export default RegisterForm;

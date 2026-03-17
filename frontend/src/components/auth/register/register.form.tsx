import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Avatar, Button, Col, Form, Input, Row, Space, Typography, Upload } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ROUTES } from '../../../constants';
import { uploadService } from '../../../services/upload.service';
import { useAuthStore } from '../../../stores';
import { registerSchema } from '../../../validations';
import type { RegisterSchemaValues } from '../../../validations';
import { toast } from 'sonner';
import { normalizeVietnamPhoneInput, toVietnamPhoneE164 } from '../../../utils/phone.util';

const RegisterForm = () => {
	const navigate = useNavigate();
	const { registerMerchant, isLoading, error, clearError } = useAuthStore();
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<RegisterSchemaValues>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
			fullName: '',
			shopName: '',
			email: '',
			phone: '',
			address: '',
			avatarUrl: '',
			password: '',
			confirmPassword: '',
		},
	});

	const ownerName = watch('fullName');

	const onSubmit = async (values: RegisterSchemaValues) => {
		let avatarUrl: string | null = null;

		if (avatarFile) {
			try {
				const uploadRes = await uploadService.uploadPublicImage(avatarFile);
				avatarUrl = uploadRes.data?.url || null;
			} catch {
				toast.error('Avatar upload failed. Please try again.');
				return;
			}
		}

		const success = await registerMerchant({
			fullName: values.fullName,
			shopName: values.shopName,
			email: values.email,
			phone: toVietnamPhoneE164(values.phone),
			address: values.address,
			avatarUrl,
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
				<Form.Item label="Avatar (optional)">
					<Space align="center" size={12}>
						<Avatar size={56} src={avatarPreview || undefined}>{(ownerName || 'M').charAt(0).toUpperCase()}</Avatar>
						<Upload
							beforeUpload={(file) => {
								setAvatarFile(file as File);
								const reader = new FileReader();
								reader.onload = (event) => setAvatarPreview(event.target?.result as string);
								reader.readAsDataURL(file as File);
								return false;
							}}
							maxCount={1}
							accept="image/*"
							showUploadList={false}
						>
							<Button>Select avatar</Button>
						</Upload>
					</Space>
				</Form.Item>

				<Row gutter={12}>
					<Col xs={24} md={12}>
						<Form.Item label="Owner Name" validateStatus={errors.fullName ? 'error' : ''} help={errors.fullName?.message}>
							<Controller control={control} name="fullName" render={({ field }) => <Input {...field} placeholder="Nguyen Van A" onChange={(event) => { clearError(); field.onChange(event); }} />} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item label="Shop Name" validateStatus={errors.shopName ? 'error' : ''} help={errors.shopName?.message}>
							<Controller control={control} name="shopName" render={({ field }) => <Input {...field} placeholder="Sunset Coffee Booth" onChange={(event) => { clearError(); field.onChange(event); }} />} />
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={12}>
					<Col xs={24} md={12}>
						<Form.Item label="Email" validateStatus={errors.email ? 'error' : ''} help={errors.email?.message}>
							<Controller control={control} name="email" render={({ field }) => <Input {...field} placeholder="merchant@audiotour.local" onChange={(event) => { clearError(); field.onChange(event); }} />} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item label="Phone" validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message}>
							<Controller
								control={control}
								name="phone"
								render={({ field }) => (
									<Input
										{...field}
										addonBefore="+84"
										maxLength={10}
										placeholder="Nhập số điện thoại (không cần số 0 đầu)"
										onChange={(event) => {
											clearError();
											field.onChange(normalizeVietnamPhoneInput(event.target.value));
										}}
									/>
								)}
							/>
						</Form.Item>
					</Col>
				</Row>

				<Row gutter={12}>
					<Col xs={24} md={12}>
						<Form.Item label="Password" validateStatus={errors.password ? 'error' : ''} help={errors.password?.message}>
							<Controller control={control} name="password" render={({ field }) => <Input.Password {...field} placeholder="Create password" onChange={(event) => { clearError(); field.onChange(event); }} />} />
						</Form.Item>
					</Col>
					<Col xs={24} md={12}>
						<Form.Item label="Confirm Password" validateStatus={errors.confirmPassword ? 'error' : ''} help={errors.confirmPassword?.message}>
							<Controller control={control} name="confirmPassword" render={({ field }) => <Input.Password {...field} placeholder="Re-enter password" onChange={(event) => { clearError(); field.onChange(event); }} />} />
						</Form.Item>
					</Col>
				</Row>

				<Form.Item label="Address" validateStatus={errors.address ? 'error' : ''} help={errors.address?.message}>
					<Controller control={control} name="address" render={({ field }) => <Input {...field} placeholder="123 Nguyen Hue, HCMC" onChange={(event) => { clearError(); field.onChange(event); }} />} />
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

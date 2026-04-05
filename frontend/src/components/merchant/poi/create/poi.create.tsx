import { Button, Col, Form, Input, InputNumber, Row, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useState } from 'react';
import { toast } from 'sonner';
import { merchantPoiService } from '../../../../services/merchant/poi.service';
import { uploadService } from '../../../../services/upload.service';
import { PoiAudioPreview, PoiMap } from '../../../shared';

interface MerchantPoiCreateProps {
	onCreated?: () => void;
}

const MerchantPoiCreate = ({ onCreated }: MerchantPoiCreateProps) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [pickedPosition, setPickedPosition] = useState<{ latitude: number; longitude: number } | null>(null);

	const beforeUpload: UploadProps['beforeUpload'] = (file) => {
		setImageFile(file as File);
		return false;
	};

	const onSubmit = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);

			let imageUrl: string | undefined;
			if (imageFile) {
				const uploadRes = await uploadService.uploadImage(imageFile);
				imageUrl = uploadRes.data?.url;
			}

			await merchantPoiService.create({
				name: values.name,
				description: values.description,
				address: values.address,
				latitude: Number(values.latitude),
				longitude: Number(values.longitude),
				audioMode: 'tts',
				ttsContent: values.ttsContent,
				imageUrl,
			});

			toast.success('POI created and submitted for approval');
			form.resetFields();
			setImageFile(null);
			setPickedPosition(null);
			onCreated?.();
		} catch (err: unknown) {
			const axiosErr = err as { response?: { data?: { message?: string } } };
			toast.error(axiosErr.response?.data?.message || 'Failed to create POI');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Form form={form} layout="vertical" onFinish={onSubmit} initialValues={{ audioMode: 'tts' }}>
			<Row gutter={12}>
				<Col xs={24} md={12}><Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item></Col>
				<Col xs={24} md={12}><Form.Item label="Address" name="address" rules={[{ required: true, message: 'Address is required' }]}><Input /></Form.Item></Col>
			</Row>
			<Form.Item label="Description" name="description"><Input.TextArea rows={3} /></Form.Item>
			<Form.Item name="audioMode" hidden><Input /></Form.Item>

			<Form.Item shouldUpdate noStyle>
				{() => (
					<>
						<Form.Item
							label="TTS Content"
							name="ttsContent"
							rules={[{ required: true, message: 'TTS content is required' }]}
						>
							<Input.TextArea rows={4} autoSize={{ minRows: 4, maxRows: 12 }} showCount placeholder="Enter text to convert to speech" />
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
			</Form.Item>

			<Row gutter={12}>
				<Col xs={24} md={12}><Form.Item label="Latitude" name="latitude" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
				<Col xs={24} md={12}><Form.Item label="Longitude" name="longitude" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
			</Row>

			<Form.Item label="Image">
				<Upload beforeUpload={beforeUpload} maxCount={1} accept="image/*" fileList={imageFile ? ([{ uid: 'new', name: imageFile.name, status: 'done' } as UploadFile]) : []}>
					<Button>Choose image</Button>
				</Upload>
			</Form.Item>

			<Form.Item label="Pick coordinate on map (click inside bounds)">
				<PoiMap
					height={320}
					selectedPosition={pickedPosition}
					onPickPosition={(latitude, longitude) => {
						setPickedPosition({ latitude, longitude });
						form.setFieldsValue({ latitude, longitude });
					}}
				/>
			</Form.Item>

			<Button htmlType="submit" type="primary" loading={loading}>Create POI</Button>
		</Form>
	);
};

export default MerchantPoiCreate;

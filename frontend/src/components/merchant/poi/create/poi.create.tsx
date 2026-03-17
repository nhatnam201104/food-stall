import { Button, Col, Form, Input, InputNumber, Row, Select, Upload } from 'antd';
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
	const [audioFile, setAudioFile] = useState<File | null>(null);
	const [pickedPosition, setPickedPosition] = useState<{ latitude: number; longitude: number } | null>(null);

	const beforeUpload: UploadProps['beforeUpload'] = (file) => {
		setImageFile(file as File);
		return false;
	};

	const beforeAudioUpload: UploadProps['beforeUpload'] = (file) => {
		setAudioFile(file as File);
		return false;
	};

	const onSubmit = async () => {
		try {
			const values = await form.validateFields();
			setLoading(true);

			let imageUrl: string | undefined;
			let audioUrl: string | undefined;
			if (imageFile) {
				const uploadRes = await uploadService.uploadImage(imageFile);
				imageUrl = uploadRes.data?.url;
			}

			if (values.audioMode === 'file') {
				if (!audioFile) {
					toast.error('Please upload an audio file when audio mode is File');
					setLoading(false);
					return;
				}

				const uploadAudioRes = await uploadService.uploadAudio(audioFile);
				audioUrl = uploadAudioRes.data?.url;
			}

			await merchantPoiService.create({
				name: values.name,
				description: values.description,
				address: values.address,
				latitude: Number(values.latitude),
				longitude: Number(values.longitude),
				radiusMeters: Number(values.radiusMeters || 15),
				priority: Number(values.priority || 1),
				audioMode: values.audioMode,
				ttsContent: values.audioMode === 'tts' ? values.ttsContent : undefined,
				audioUrl: values.audioMode === 'file' ? audioUrl : undefined,
				cooldownSeconds: Number(values.cooldownSeconds || 30),
				imageUrl,
			});

			toast.success('POI created and submitted for approval');
			form.resetFields();
			setImageFile(null);
			setAudioFile(null);
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

			<Row gutter={12}>
				<Col xs={24} md={12}>
					<Form.Item label="Audio Mode" name="audioMode" rules={[{ required: true, message: 'Audio mode is required' }]}>
						<Select options={[{ value: 'tts', label: 'TTS (Text to Speech)' }, { value: 'file', label: 'Audio File' }]} />
					</Form.Item>
				</Col>
			</Row>
			<Form.Item shouldUpdate noStyle>
				{() => (
					<>
						{form.getFieldValue('audioMode') === 'tts' && (
							<>
								<Form.Item
									label="TTS Content"
									name="ttsContent"
									rules={[{ required: true, message: 'TTS content is required in TTS mode' }]}
								>
									<Input.TextArea rows={4} placeholder="Enter text to convert to speech" />
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

						{form.getFieldValue('audioMode') === 'file' && (
							<>
								<Form.Item label="Audio File" required>
									<Upload
										beforeUpload={beforeAudioUpload}
										maxCount={1}
										accept="audio/*"
										fileList={audioFile ? ([{ uid: 'new-audio', name: audioFile.name, status: 'done' } as UploadFile]) : []}
									>
										<Button>Choose audio</Button>
									</Upload>
								</Form.Item>
								<PoiAudioPreview audioMode="file" localAudioFile={audioFile} />
							</>
						)}
					</>
				)}
			</Form.Item>

			<Row gutter={12}>
				<Col xs={24} md={12}><Form.Item label="Latitude" name="latitude" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
				<Col xs={24} md={12}><Form.Item label="Longitude" name="longitude" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
			</Row>

			<Row gutter={12}>
				<Col xs={24} md={8}><Form.Item label="Radius" name="radiusMeters" initialValue={15}><InputNumber style={{ width: '100%' }} min={10} max={500} /></Form.Item></Col>
				<Col xs={24} md={8}><Form.Item label="Priority" name="priority" initialValue={1}><InputNumber style={{ width: '100%' }} min={1} max={10} /></Form.Item></Col>
				<Col xs={24} md={8}><Form.Item label="Cooldown" name="cooldownSeconds" initialValue={30}><InputNumber style={{ width: '100%' }} min={5} max={600} /></Form.Item></Col>
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

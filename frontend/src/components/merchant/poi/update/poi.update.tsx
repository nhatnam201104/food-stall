import { Button, Form, Input, InputNumber, Select } from 'antd';
import type { PointOfInterest } from '../../../../types';

interface MerchantPoiUpdateProps {
	poi: PointOfInterest | null;
}

const MerchantPoiUpdate = ({ poi }: MerchantPoiUpdateProps) => (
	<Form layout="vertical" initialValues={poi ?? undefined} key={poi?.id}>
		<Form.Item label="Name" name="name"><Input /></Form.Item>
		<Form.Item label="Description" name="description"><Input.TextArea rows={3} /></Form.Item>
		<Form.Item label="Latitude" name="latitude"><InputNumber style={{ width: '100%' }} /></Form.Item>
		<Form.Item label="Longitude" name="longitude"><InputNumber style={{ width: '100%' }} /></Form.Item>
		<Form.Item label="Radius" name="radiusMeters"><InputNumber style={{ width: '100%' }} /></Form.Item>
		<Form.Item label="Priority" name="priority"><InputNumber style={{ width: '100%' }} /></Form.Item>
		<Form.Item label="Audio Mode" name="audioMode"><Select options={[{ value: 'tts', label: 'TTS' }, { value: 'file', label: 'File' }]} /></Form.Item>
		<Form.Item label="Status" name="isActive"><Select options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]} /></Form.Item>
		<Button type="primary">Save (Mock)</Button>
	</Form>
);

export default MerchantPoiUpdate;

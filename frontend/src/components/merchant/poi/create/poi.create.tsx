import { Button, Form, Input, InputNumber, Select } from 'antd';

const MerchantPoiCreate = () => (
	<Form layout="vertical">
		<Form.Item label="Name"><Input /></Form.Item>
		<Form.Item label="Description"><Input.TextArea rows={3} /></Form.Item>
		<Form.Item label="Latitude"><InputNumber style={{ width: '100%' }} /></Form.Item>
		<Form.Item label="Longitude"><InputNumber style={{ width: '100%' }} /></Form.Item>
		<Form.Item label="Radius"><InputNumber style={{ width: '100%' }} /></Form.Item>
		<Form.Item label="Priority"><InputNumber style={{ width: '100%' }} /></Form.Item>
		<Form.Item label="Audio Mode"><Select options={[{ value: 'tts', label: 'TTS' }, { value: 'file', label: 'File' }]} /></Form.Item>
		<Form.Item label="Status"><Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} /></Form.Item>
		<Button type="primary">Create (Mock)</Button>
	</Form>
);

export default MerchantPoiCreate;

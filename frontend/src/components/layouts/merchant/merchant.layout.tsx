import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import MerchantFooter from './merchant.footer';
import MerchantHeader from './merchant.header';
import MerchantSidebar from './merchant.sidebar';

const { Sider, Header, Content, Footer } = Layout;

const MerchantLayout = () => (
	<Layout style={{ minHeight: '100vh' }}>
		<Sider width={250} breakpoint="lg" collapsedWidth={64} theme="light" className="app-shell-sider">
			<div className="app-shell-brand">Audio Tour Merchant</div>
			<MerchantSidebar />
		</Sider>
		<Layout>
			<Header className="app-shell-header" style={{ padding: '0 20px' }}>
				<MerchantHeader />
			</Header>
			<Content className="app-shell-content">
				<Outlet />
			</Content>
			<Footer className="app-shell-footer" style={{ background: '#fff', textAlign: 'center' }}>
				<MerchantFooter />
			</Footer>
		</Layout>
	</Layout>
);

export default MerchantLayout;

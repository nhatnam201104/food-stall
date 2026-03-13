import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import AdminFooter from './admin.footer';
import AdminHeader from './admin.header';
import AdminSidebar from './admin.sidebar';

const { Sider, Header, Content, Footer } = Layout;

const AdminLayout = () => (
	<Layout style={{ minHeight: '100vh' }}>
		<Sider width={250} breakpoint="lg" collapsedWidth={64} theme="light" className="app-shell-sider">
			<div className="app-shell-brand">Audio Tour Admin</div>
			<AdminSidebar />
		</Sider>
		<Layout>
			<Header className="app-shell-header" style={{ padding: '0 20px' }}>
				<AdminHeader />
			</Header>
			<Content className="app-shell-content">
				<Outlet />
			</Content>
			<Footer className="app-shell-footer" style={{ background: '#fff', textAlign: 'center' }}>
				<AdminFooter />
			</Footer>
		</Layout>
	</Layout>
);

export default AdminLayout;

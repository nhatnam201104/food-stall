import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './public.header';
import { PublicFooter } from './public.footer';
import { AppInstallPrompt } from '../../public/app-install.prompt';

const { Content } = Layout;

const PublicLayout = () => {
    return (
        <Layout className="public-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <PublicHeader />
            <Content style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 64, background: '#fff' }}>
                <Outlet />
            </Content>
            <PublicFooter />
            <AppInstallPrompt />
        </Layout>
    );
};

export default PublicLayout;
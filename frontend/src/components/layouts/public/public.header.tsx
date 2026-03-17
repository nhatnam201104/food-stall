import { Layout, Menu, Button, Drawer } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { MenuOutlined, DashboardOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { ROUTES } from '../../../constants';
import { useAuthStore } from '../../../stores';

const { Header } = Layout;

export const PublicHeader = () => {
    const location = useLocation();
    const [visible, setVisible] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isHydrated, user } = useAuthStore();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const showDrawer = () => {
        setVisible(true);
    };

    const onClose = () => {
        setVisible(false);
    };

    const menuItems = [
        { key: ROUTES.public.home, label: <Link to={ROUTES.public.home}>Home</Link> },
        { key: ROUTES.public.pricing, label: <Link to={ROUTES.public.pricing}>Pricing</Link> },
        { key: ROUTES.public.contact, label: <Link to={ROUTES.public.contact}>Contact</Link> },
    ];

    return (
        <Header 
            style={{ 
                position: 'fixed', 
                zIndex: 1000, 
                width: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0 50px',
                background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'white',
                boxShadow: scrolled ? '0 2px 8px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
            }}
            className="public-header"
        >
            <div className="logo" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1677ff', transition: '0.3s' }}>
                <Link to={ROUTES.public.home} style={{ color: 'inherit', textDecoration: 'none' }}>FoodStall Hub</Link>
            </div>
            
            <Menu 
                mode="horizontal" 
                selectedKeys={[location.pathname]} 
                items={menuItems} 
                style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    borderBottom: 'none', 
                    background: 'transparent',
                    display: 'none',
                }}
                className="desktop-menu-wrapper"
            />

            <style>
                {`
                    @media (min-width: 768px) {
                        .desktop-menu-wrapper { display: flex !important; }
                        .mobile-menu-btn { display: none !important; }
                        .auth-buttons { display: flex !important; }
                    }
                    @media (max-width: 767px) {
                        .auth-buttons { display: none !important; }
                    }
                `}
            </style>
            
            <div className="auth-buttons" style={{ gap: '8px', alignItems: 'center' }}>
                {isHydrated && user ? (
                    <Link to={user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.merchant.dashboard}>
                        <Button type="primary" icon={<DashboardOutlined />}>Dashboard</Button>
                    </Link>
                ) : (
                    <>
                        <Link to={ROUTES.auth.merchantLogin}><Button type="text">Login</Button></Link>
                        <Link to={ROUTES.auth.merchantRegister}><Button type="primary">Sign Up Free</Button></Link>
                    </>
                )}
            </div>

            <Button className="mobile-menu-btn" type="text" icon={<MenuOutlined />} onClick={showDrawer} />

            <Drawer title="Menu" placement="right" onClose={onClose} open={visible}>
                <Menu mode="vertical" selectedKeys={[location.pathname]} items={menuItems} onClick={onClose} style={{ borderRight: 'none' }} />
                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: '12px', padding: '0 16px' }}>
                    {isHydrated && user ? (
                        <Link to={user.role === 'admin' ? ROUTES.admin.dashboard : ROUTES.merchant.dashboard} onClick={onClose}>
                            <Button type="primary" block icon={<DashboardOutlined />}>Dashboard</Button>
                        </Link>
                    ) : (
                        <>
                            <Link to={ROUTES.auth.merchantLogin} onClick={onClose}><Button block>Login</Button></Link>
                            <Link to={ROUTES.auth.merchantRegister} onClick={onClose}><Button type="primary" block>Sign Up Free</Button></Link>
                        </>
                    )}
                </div>
            </Drawer>
        </Header>
    );
};

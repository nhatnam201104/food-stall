import { Button, Modal, Typography } from 'antd';
import { DownloadOutlined, CloseOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';

const { Text, Title } = Typography;

export const AppInstallPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isMobileOrTablet = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasPrompted = sessionStorage.getItem('appInstallPrompted');

        if (isMobileOrTablet && !hasPrompted) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000); // Show after 3 seconds
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        sessionStorage.setItem('appInstallPrompted', 'true');
    };

    const handleInstall = () => {
        handleClose();
        // Redirect to app store based on OS ideally, fallback to generic
        window.open('https://play.google.com/store/apps', '_blank');
    };

    return (
        <Modal
            open={isVisible}
            onCancel={handleClose}
            footer={null}
            closeIcon={<CloseOutlined />}
            centered
            maskClosable={false}
            className="app-install-modal"
            width={320}
        >
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                    width: 64, height: 64, background: '#1677ff', borderRadius: 16,
                    margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <DownloadOutlined style={{ color: '#fff', fontSize: 32 }} />
                </div>
                <Title level={4} style={{ marginBottom: 4 }}>Better Experience</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
                    Install our app for a smoother, faster experience and get the latest notifications!
                </Text>
                
                <Button 
                    type="primary" 
                    size="large" 
                    block 
                    icon={<DownloadOutlined />}
                    onClick={handleInstall}
                    style={{ marginBottom: 12, borderRadius: 8 }}
                >
                    Install Now
                </Button>
                <Button 
                    type="text" 
                    block 
                    onClick={handleClose}
                    style={{ color: '#888' }}
                >
                    Maybe Later
                </Button>
            </div>
        </Modal>
    );
};
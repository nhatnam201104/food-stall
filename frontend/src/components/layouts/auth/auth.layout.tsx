import { Layout, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

const { Content } = Layout;

interface AuthLayoutProps {
	children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => (
	<Layout className="auth-background" style={{ minHeight: '100vh' }}>
		<Content style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
			<div className="auth-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr' }}>
				<div className="auth-side">
					<Space direction="vertical" size={10}>
						<Typography.Title level={2} style={{ color: '#fff', marginBottom: 4 }}>
							Audio Tour Guide
						</Typography.Title>
						<Typography.Text style={{ color: 'rgba(255,255,255,0.88)' }}>
							Enterprise-grade dashboard for Admin and Merchant operations.
						</Typography.Text>
						<div style={{ marginTop: 20, border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: 14 }}>
							<Typography.Text style={{ color: '#fff' }}>
								✅ Unified login for Admin + Merchant
							</Typography.Text>
							<br />
							<Typography.Text style={{ color: '#fff' }}>
								✅ Merchant-only registration
							</Typography.Text>
							<br />
							<Typography.Text style={{ color: '#fff' }}>
								✅ Role-based secure route access
							</Typography.Text>
						</div>
					</Space>
				</div>
				<div className="auth-form-wrap">{children}</div>
			</div>
		</Content>
	</Layout>
);

export default AuthLayout;

import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/route.index';
import { useAuthStore } from './stores';

const App = () => {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2f54eb',
          colorBgLayout: '#f2f5fb',
          borderRadius: 12,
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        },
        components: {
          Card: {
            borderRadiusLG: 14,
          },
          Table: {
            headerBg: '#f7f9ff',
            borderColor: '#e8ecf7',
          },
          Layout: {
            headerBg: '#ffffff',
            siderBg: '#ffffff',
            bodyBg: '#f2f5fb',
            triggerBg: '#ffffff',
          },
        },
      }}
    >
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
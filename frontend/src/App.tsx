import { useEffect } from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
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
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          Layout: {
            headerBg: '#ffffff',
          },
        },
      }}
    >
      <AntdApp>
        <Toaster richColors position="top-right" duration={4000} />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
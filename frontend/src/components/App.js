import { useState, useEffect } from 'preact/hooks';
import { styled } from 'goober';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toast } from './Toast';

const AppContainer = styled('div')`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled('div')`
  flex: 1;
  display: flex;
  margin-top: 64px; /* Header height */
`;

const ContentArea = styled('div')`
  flex: 1;
  padding: 2rem;
  background-color: #f9fafb;
  min-height: calc(100vh - 64px);
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ToastContainer = styled('div')`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export function App({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Add toast function
  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  // Remove toast function
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Make addToast available globally
  useEffect(() => {
    window.addToast = addToast;
    return () => {
      delete window.addToast;
    };
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      addToast('Connection restored', 'success');
    };

    const handleOffline = () => {
      addToast('Connection lost - working offline', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AppContainer>
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      
      <MainContent>
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
        />
        
        <ContentArea>
          {children}
        </ContentArea>
      </MainContent>

      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </AppContainer>
  );
}
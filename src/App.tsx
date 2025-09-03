import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthPage } from './components/Auth/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { InvoiceUpload } from './components/InvoiceUpload';
import { InvoiceList } from './components/InvoiceList';
import { Settings } from './components/Settings';
import { PayrollCosts } from './components/PayrollCosts';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { CalendarPage } from './components/calendar/CalendarPage';
import { ChatPage } from './components/chat/ChatPage';
import { JelenletiPage } from './components/JelenletiPage';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';


const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Reset to collapsed on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear company access on app unmount (when user closes browser/tab)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Company access will be cleared automatically when session ends
      // This is just for cleanup if needed
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const renderActiveComponent = () => {
    const profileType = user?.user_metadata?.profile_type;
    
    switch (activeTab) {
      case 'dashboard':
        // Show different dashboards based on profile type
        if (profileType === 'vezetoi') {
          return <ManagerDashboard />;
        } else if (profileType === 'pedagogus') {
          return <TeacherDashboard onTabChange={setActiveTab} />;
        }
        return <Dashboard />;
      case 'calendar':
        return <CalendarPage />;
      case 'chat':
        return <ChatPage />;
      case 'upload':
        return <InvoiceUpload />;
      case 'invoices':
        return <InvoiceList />;
      case 'documents':
        return <DocumentsPage />;
      case 'payroll':
        return <PayrollCosts />;
      case 'jelenleti':
        return <JelenletiPage />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-2 border-foreground-subtle border-t-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted text-sm sm:text-base">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-72' : 'lg:ml-20'
      } pt-14 sm:pt-16 lg:pt-0 overflow-x-hidden`}>
        <div className="min-h-screen bg-surface">
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
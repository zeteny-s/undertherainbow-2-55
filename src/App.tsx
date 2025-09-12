import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { NotificationContainer } from './components/common/NotificationContainer';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthPage } from './components/Auth/AuthPage';
import { Dashboard } from './components/Dashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { CalendarPage } from './components/calendar/CalendarPage';
import { ChatPage } from './components/chat/ChatPage';
import { DocumentsPage } from './components/documents/DocumentsPage';
import { InvoiceUpload } from './components/InvoiceUpload';
import { InvoiceList } from './components/InvoiceList';
import { PayrollCosts } from './components/PayrollCosts';
import { JelenletiPage } from './components/JelenletiPage';
import { FamilyRelationshipsPage } from './components/family-relationships/FamilyRelationshipsPage';
import { NewsFormsPage } from './components/news-forms/NewsFormsPage';
import { FormBuilderPage } from './components/news-forms/FormBuilderPage';
import { NewsletterBuilderPage } from './components/news-forms/NewsletterBuilderPage';
import { NewsletterDragBuilderPage } from './components/news-forms/NewsletterDragBuilderPage';
import { PublicFormPage } from './components/news-forms/PublicFormPage';
import { PublicNewsletterPage } from './components/news-forms/PublicNewsletterPage';
import { Settings } from './components/Settings';
import { Profile } from './components/Profile';
import { useState } from 'react';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Public routes for forms and newsletters
  if (window.location.pathname.startsWith('/form/') || window.location.pathname.startsWith('/newsletter/')) {
    return (
      <Routes>
        <Route path="/form/:formId" element={<PublicFormPage />} />
        <Route path="/newsletter/:newsletterId" element={<PublicNewsletterPage />} />
      </Routes>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  const getDashboardComponent = () => {
    const profileType = user?.user_metadata?.profile_type;
    
    if (profileType === 'vezetoi') {
      return <ManagerDashboard />;
    } else if (profileType === 'pedagogus') {
      return <TeacherDashboard />;
    }
    return <Dashboard />;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <Routes>
          {/* Dashboard Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                {getDashboardComponent()}
              </ProtectedRoute>
            } 
          />
          
          {/* General Routes */}
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <DocumentsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin/Management Routes */}
          <Route 
            path="/upload" 
            element={
              <ProtectedRoute allowedRoles={['adminisztracio', 'vezetoi', 'haz_vezeto']}>
                <InvoiceUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invoices" 
            element={
              <ProtectedRoute allowedRoles={['adminisztracio', 'vezetoi', 'haz_vezeto']}>
                <InvoiceList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payroll" 
            element={
              <ProtectedRoute allowedRoles={['vezetoi']}>
                <PayrollCosts />
              </ProtectedRoute>
            } 
          />
          
          {/* Attendance Route */}
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute allowedRoles={['pedagogus', 'adminisztracio', 'vezetoi', 'haz_vezeto']}>
                <JelenletiPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Family Relationships Route */}
          <Route 
            path="/family-relationships" 
            element={
              <ProtectedRoute allowedRoles={['haz_vezeto']}>
                <FamilyRelationshipsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* News & Forms Routes */}
          <Route 
            path="/news-forms" 
            element={
              <ProtectedRoute>
                <NewsFormsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/news-forms/new" 
            element={
              <ProtectedRoute>
                <FormBuilderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/news-forms/edit/:formId" 
            element={
              <ProtectedRoute>
                <FormBuilderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/newsletters/new" 
            element={
              <ProtectedRoute>
                <NewsletterBuilderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/newsletters/edit/:newsletterId" 
            element={
              <ProtectedRoute>
                <NewsletterBuilderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/newsletter-builder/new" 
            element={
              <ProtectedRoute>
                <NewsletterDragBuilderPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/newsletter-builder/:newsletterId" 
            element={
              <ProtectedRoute>
                <NewsletterDragBuilderPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Settings & Profile Routes */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      
      <NotificationContainer notifications={[]} onRemove={() => {}} />
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
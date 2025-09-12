import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Menu, Calendar, MessageCircle, FileText, Upload, List, Calculator, Users, ClipboardList, Home, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileModal } from './ProfileModal';
import { Button } from './ui/button';
import { useTranslation } from '../hooks/useTranslation';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };


  const getMenuItems = () => {
    const profileType = user?.user_metadata?.profile_type;
    
    const commonItems = [
      { id: 'dashboard', label: t('nav.overview'), icon: Home, path: '/' },
      { id: 'calendar', label: t('nav.calendar'), icon: Calendar, path: '/calendar' },
      { id: 'chat', label: t('nav.chat'), icon: MessageCircle, path: '/chat' },
      { id: 'documents', label: t('nav.documents'), icon: FileText, path: '/documents' },
      { id: 'news-forms', label: 'Hírlevelek és Űrlapok', icon: ClipboardList, path: '/news-forms' },
    ];

    const roleSpecificItems = [];

    if (profileType === 'adminisztracio' || profileType === 'vezetoi' || profileType === 'haz_vezeto') {
      roleSpecificItems.push(
        { id: 'upload', label: t('nav.registrar'), icon: Upload, path: '/upload' },
        { id: 'invoices', label: t('nav.invoices'), icon: List, path: '/invoices' }
      );
    }

    if (profileType === 'vezetoi') {
      roleSpecificItems.push(
        { id: 'payroll', label: t('nav.payroll'), icon: Calculator, path: '/payroll' }
      );
    }

    if (profileType === 'pedagogus' || profileType === 'adminisztracio' || profileType === 'vezetoi' || profileType === 'haz_vezeto') {
      roleSpecificItems.push(
        { id: 'attendance', label: t('nav.attendance'), icon: Users, path: '/attendance' }
      );
    }

    if (profileType === 'haz_vezeto') {
      roleSpecificItems.push(
        { id: 'family-relationships', label: t('nav.familyRelationships'), icon: Users, path: '/family-relationships' }
      );
    }

    return [...commonItems, ...roleSpecificItems];
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.name || user?.email || '';
    return name.split(' ').map((word: string) => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-2"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div 
          className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium cursor-pointer"
          onClick={() => setShowProfileModal(true)}
        >
          {getUserInitials()}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-64 lg:w-64
      `}>
        {/* User Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-medium cursor-pointer"
              onClick={() => setShowProfileModal(true)}
            >
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.name || user?.email}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const IconComponent = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path)}
                className={`
                  w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                title={item.label}
              >
                <IconComponent className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings and Logout */}
        <div className="border-t border-gray-100 p-4 space-y-2">
          <button
            onClick={() => handleNavigation('/settings')}
            className={`
              w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
              ${location.pathname === '/settings'
                ? 'bg-primary text-white' 
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <Settings className={`h-5 w-5 mr-3 ${location.pathname === '/settings' ? 'text-white' : 'text-gray-500'}`} />
            <span>{t('nav.settings')}</span>
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3 text-gray-500" />
            <span>{t('auth.signOut')}</span>
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
};

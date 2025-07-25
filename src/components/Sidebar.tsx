import React, { useState } from 'react';
import { BarChart3, Upload, FileText, LogOut, ChevronRight, ChevronLeft, Settings, Menu, X, DollarSign, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ProfileModal } from './ProfileModal';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isOpen, onToggle }) => {
  const { user, signOut } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  // Base menu items for all users
  const baseMenuItems = [
    {
      id: 'dashboard',
      label: 'Áttekintés',
      icon: BarChart3,
    },
    {
      id: 'upload',
      label: 'Iktató',
      icon: Upload,
    },
    {
      id: 'invoices',
      label: 'Számlák',
      icon: FileText,
    },
    {
      id: 'settings',
      label: 'Beállítások',
      icon: Settings,
    },
  ];

  // Additional menu items for manager profile
  const managerMenuItems = [
    {
      id: 'teams',
      label: 'Csapatok',
      icon: Users,
    },
    {
      id: 'payroll',
      label: 'Bérköltségek',
      icon: DollarSign,
    },
  ];

  // Combine menu items based on user profile
  const menuItems = user?.user_metadata?.profile_type === 'vezetoi' 
    ? [...baseMenuItems, ...managerMenuItems]
    : baseMenuItems;

  // Get user initials for profile picture
  const getUserInitials = (email: string, name?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const userInitials = getUserInitials(user?.email || '', user?.user_metadata?.name);
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Felhasználó';

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 sm:h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-3 sm:px-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
        </button>
        
       
        
        <button
          onClick={() => setShowProfileModal(true)}
          className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm"
        >
          {userInitials}
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200/80 z-50 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64 sm:w-72' : 'w-20 lg:w-20'
      } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Mobile close button */}
        <div className="lg:hidden absolute top-3 sm:top-4 right-3 sm:right-4">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
          </button>
        </div>

        {/* Toggle button - desktop only */}
        <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={onToggle}
            className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group hover:scale-105"
          >
            {isOpen ? (
              <ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-800" />
            )}
          </button>
        </div>

        {/* Header with profile picture */}
        <div className="h-14 sm:h-16 flex items-center justify-center border-b border-gray-100 mt-0 lg:mt-0">
          <div className={`flex items-center space-x-3 ${isOpen ? 'px-3 sm:px-4' : ''}`}>
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Profil megnyitása"
            >
              {userInitials}
            </button>
            {isOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6">
          <div className="space-y-1 sm:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 sm:h-8 bg-blue-600 rounded-r-full"></div>
                    )}
                    
                    <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 ${isOpen ? 'mr-3 sm:mr-4' : 'mx-auto'}`}>
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200 ${
                        isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                    </div>
                    
                    {isOpen && (
                      <span className={`transition-all duration-300 truncate ${
                        isActive ? 'text-blue-700' : 'text-gray-700 group-hover:text-gray-900'
                      }`}>
                        {item.label}
                      </span>
                    )}
                  </button>
                  
                  {/* Tooltip for collapsed state - desktop only */}
                  {!isOpen && (
                    <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      {item.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Logout section */}
        <div className="border-t border-gray-100 p-3 sm:p-4">
          {/* Logout button */}
          <div className="relative group">
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 ${
                !isOpen ? 'justify-center' : ''
              }`}
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              {isOpen && (
                <span className="ml-3 sm:ml-4 text-sm font-medium">
                  Kijelentkezés
                </span>
              )}
            </button>
            
            {/* Tooltip for collapsed state - desktop only */}
            {!isOpen && (
              <div className="hidden lg:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                Kijelentkezés
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />
    </>
  );
};

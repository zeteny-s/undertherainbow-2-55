import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsData {
  theme: 'light' | 'dark' | 'system';
  language: 'hu' | 'en';
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    invoiceProcessed: boolean;
    systemUpdates: boolean;
  };
  privacy: {
    dataRetention: '1year' | '2years' | '5years' | 'forever';
    analyticsEnabled: boolean;
    crashReporting: boolean;
  };
  display: {
    compactMode: boolean;
    showAnimations: boolean;
    highContrast: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
  };
}

interface SettingsContextType {
  settings: SettingsData;
  updateSettings: (newSettings: Partial<SettingsData>) => void;
  resetSettings: () => void;
  exportSettings: () => void;
  importSettings: (file: File) => Promise<void>;
}

const defaultSettings: SettingsData = {
  theme: 'light',
  language: 'hu',
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    invoiceProcessed: true,
    systemUpdates: false,
  },
  privacy: {
    dataRetention: '2years',
    analyticsEnabled: true,
    crashReporting: true,
  },
  display: {
    compactMode: false,
    showAnimations: true,
    highContrast: false,
  },
  backup: {
    autoBackup: true,
    backupFrequency: 'weekly',
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Apply display settings
  useEffect(() => {
    applyDisplaySettings(settings.display);
  }, [settings.display]);

  // Apply compact mode
  useEffect(() => {
    document.documentElement.classList.toggle('compact-mode', settings.display.compactMode);
  }, [settings.display.compactMode]);

  // Apply high contrast
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', settings.display.highContrast);
  }, [settings.display.highContrast]);

  // Apply animations setting
  useEffect(() => {
    if (!settings.display.showAnimations) {
      document.documentElement.classList.add('no-animations');
    } else {
      document.documentElement.classList.remove('no-animations');
    }
  }, [settings.display.showAnimations]);

  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const applyDisplaySettings = (display: SettingsData['display']) => {
    const root = document.documentElement;
    
    // Apply compact mode
    if (display.compactMode) {
      root.style.setProperty('--spacing-unit', '0.75rem');
      root.style.setProperty('--text-scale', '0.9');
    } else {
      root.style.removeProperty('--spacing-unit');
      root.style.removeProperty('--text-scale');
    }

    // Apply high contrast
    if (display.highContrast) {
      root.style.setProperty('--contrast-multiplier', '1.5');
    } else {
      root.style.removeProperty('--contrast-multiplier');
    }
  };

  const updateSettings = (newSettings: Partial<SettingsData>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Save to localStorage
      localStorage.setItem('app-settings', JSON.stringify(updated));
      
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('app-settings', JSON.stringify(defaultSettings));
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feketerigo-settings-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          
          // Validate imported settings structure
          if (typeof imported === 'object' && imported !== null) {
            setSettings(prev => {
              const merged = { ...prev, ...imported };
              localStorage.setItem('app-settings', JSON.stringify(merged));
              return merged;
            });
            resolve();
          } else {
            reject(new Error('Invalid settings file format'));
          }
        } catch (error) {
          reject(new Error('Failed to parse settings file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  const value = {
    settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
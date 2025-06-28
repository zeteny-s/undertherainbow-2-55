import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Bell, Shield, Database, Download, Upload, Palette, Globe, Clock, Save, Check, AlertCircle, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

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

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsData>({
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
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
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

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = { id, type, message };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateSettings = (section: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const updateTopLevelSetting = (key: keyof SettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('app-settings', JSON.stringify(settings));
      
      // Apply theme changes immediately
      applyTheme(settings.theme);
      
      setHasUnsavedChanges(false);
      addNotification('success', 'Beállítások sikeresen mentve!');
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification('error', 'Hiba történt a beállítások mentése során');
    } finally {
      setSaving(false);
    }
  };

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

  const resetSettings = () => {
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
    
    setSettings(defaultSettings);
    setHasUnsavedChanges(true);
    addNotification('info', 'Beállítások visszaállítva az alapértelmezett értékekre');
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feketerigo-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'Beállítások exportálva');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings(imported);
        setHasUnsavedChanges(true);
        addNotification('success', 'Beállítások sikeresen importálva');
      } catch (error) {
        addNotification('error', 'Hibás beállítás fájl');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
              notification.type === 'success' ? 'border-l-4 border-green-400' :
              notification.type === 'error' ? 'border-l-4 border-red-400' :
              'border-l-4 border-blue-400'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && (
                    <Check className="h-5 w-5 text-green-400" />
                  )}
                  {notification.type === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  {notification.type === 'info' && (
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <span className="sr-only">Bezárás</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <SettingsIcon className="h-8 w-8 mr-3 text-blue-600" />
              Beállítások
            </h2>
            <p className="text-gray-600">Alkalmazás testreszabása és konfigurálása</p>
          </div>
          
          {hasUnsavedChanges && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-orange-600 font-medium">Nem mentett változások</span>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mentés...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Mentés
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Appearance Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Palette className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Megjelenés</h3>
          </div>
          
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Téma</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => updateTopLevelSetting('theme', 'light')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    settings.theme === 'light' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <span className="text-sm font-medium">Világos</span>
                </button>
                
                <button
                  onClick={() => updateTopLevelSetting('theme', 'dark')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    settings.theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Moon className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                  <span className="text-sm font-medium">Sötét</span>
                </button>
                
                <button
                  onClick={() => updateTopLevelSetting('theme', 'system')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    settings.theme === 'system' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Monitor className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                  <span className="text-sm font-medium">Rendszer</span>
                </button>
              </div>
            </div>

            {/* Display Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Kompakt mód</label>
                  <p className="text-xs text-gray-500">Kisebb távolságok és elemek</p>
                </div>
                <button
                  onClick={() => updateSettings('display', 'compactMode', !settings.display.compactMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.display.compactMode ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.display.compactMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Animációk</label>
                  <p className="text-xs text-gray-500">Átmenetek és mozgások</p>
                </div>
                <button
                  onClick={() => updateSettings('display', 'showAnimations', !settings.display.showAnimations)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.display.showAnimations ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.display.showAnimations ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nagy kontraszt</label>
                  <p className="text-xs text-gray-500">Jobb láthatóság</p>
                </div>
                <button
                  onClick={() => updateSettings('display', 'highContrast', !settings.display.highContrast)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.display.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.display.highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-yellow-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Értesítések</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">E-mail értesítések</label>
                <p className="text-xs text-gray-500">Fontos események e-mailben</p>
              </div>
              <button
                onClick={() => updateSettings('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Push értesítések</label>
                <p className="text-xs text-gray-500">Böngésző értesítések</p>
              </div>
              <button
                onClick={() => updateSettings('notifications', 'pushNotifications', !settings.notifications.pushNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Számla feldolgozás</label>
                <p className="text-xs text-gray-500">Értesítés feldolgozás után</p>
              </div>
              <button
                onClick={() => updateSettings('notifications', 'invoiceProcessed', !settings.notifications.invoiceProcessed)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.invoiceProcessed ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.invoiceProcessed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Rendszer frissítések</label>
                <p className="text-xs text-gray-500">Új funkciók és javítások</p>
              </div>
              <button
                onClick={() => updateSettings('notifications', 'systemUpdates', !settings.notifications.systemUpdates)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.systemUpdates ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.systemUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Shield className="h-6 w-6 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Adatvédelem és biztonság</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adatok megőrzése</label>
              <select
                value={settings.privacy.dataRetention}
                onChange={(e) => updateSettings('privacy', 'dataRetention', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1year">1 év</option>
                <option value="2years">2 év</option>
                <option value="5years">5 év</option>
                <option value="forever">Korlátlan</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Mennyi ideig őrizzük meg az adatokat</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Használati statisztikák</label>
                <p className="text-xs text-gray-500">Névtelen adatok gyűjtése fejlesztéshez</p>
              </div>
              <button
                onClick={() => updateSettings('privacy', 'analyticsEnabled', !settings.privacy.analyticsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.analyticsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.analyticsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Hibajelentések</label>
                <p className="text-xs text-gray-500">Automatikus hibajelentés küldése</p>
              </div>
              <button
                onClick={() => updateSettings('privacy', 'crashReporting', !settings.privacy.crashReporting)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.privacy.crashReporting ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.crashReporting ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Backup & Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Database className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Biztonsági mentés és adatok</h3>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Automatikus mentés</label>
                <p className="text-xs text-gray-500">Beállítások automatikus mentése</p>
              </div>
              <button
                onClick={() => updateSettings('backup', 'autoBackup', !settings.backup.autoBackup)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.backup.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.backup.autoBackup ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.backup.autoBackup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mentés gyakorisága</label>
                <select
                  value={settings.backup.backupFrequency}
                  onChange={(e) => updateSettings('backup', 'backupFrequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Naponta</option>
                  <option value="weekly">Hetente</option>
                  <option value="monthly">Havonta</option>
                </select>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={exportSettings}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Beállítások exportálása
              </button>
              
              <label className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Beállítások importálása
                <input
                  type="file"
                  accept=".json"
                  onChange={importSettings}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Globe className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Nyelv és régió</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nyelv</label>
              <select
                value={settings.language}
                onChange={(e) => updateTopLevelSetting('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hu">Magyar</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Beállítások visszaállítása</h3>
              <p className="text-sm text-gray-500 mt-1">Minden beállítás visszaállítása az alapértelmezett értékekre</p>
            </div>
            <button
              onClick={resetSettings}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              Visszaállítás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
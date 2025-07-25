import React, { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Monitor, Bell, Shield, Database, Download, Upload, Palette, Globe, Save, Check, AlertCircle, X } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { BackupManager } from './BackupManager';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const Settings: React.FC = () => {
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'backup'>('general');

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

  const handleSettingChange = (section: string, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...(settings[section as keyof typeof settings] as any),
        [key]: value,
      },
    };
    updateSettings(newSettings);
    addNotification('success', 'Beállítás frissítve!');
  };

  const handleTopLevelChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
    addNotification('success', 'Beállítás frissítve!');
  };

  const handleResetSettings = () => {
    resetSettings();
    addNotification('info', 'Beállítások visszaállítva az alapértelmezett értékekre');
  };

  const handleExportSettings = () => {
    exportSettings();
    addNotification('success', 'Beállítások exportálva');
  };

  const handleImportSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importSettings(file);
      addNotification('success', 'Beállítások sikeresen importálva');
    } catch (error) {
      addNotification('error', error instanceof Error ? error.message : 'Hibás beállítás fájl');
    }

    event.target.value = '';
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      addNotification('success', 'Beállítások sikeresen mentve!');
    } catch (error) {
      addNotification('error', 'Hiba történt a beállítások mentése során');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Általános', icon: SettingsIcon },
    { id: 'backup', label: 'Biztonsági mentés', icon: Database }
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-3 w-80 max-w-[calc(100vw-2rem)]">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden transform transition-all duration-300 ease-in-out"
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  {notification.type === 'error' && (
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  {notification.type === 'info' && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {notification.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center">
              <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-blue-600" />
              Beállítások
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Alkalmazás testreszabása és konfigurálása</p>
          </div>
          
          {activeTab === 'general' && (
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 sm:mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'general' | 'backup')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Appearance Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
              <Palette className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600 mr-2 sm:mr-3" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Megjelenés</h3>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Téma</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleTopLevelChange('theme', 'light')}
                    className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      settings.theme === 'light' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sun className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-yellow-500" />
                    <span className="text-sm font-medium">Világos</span>
                  </button>
                  
                  <button
                    onClick={() => handleTopLevelChange('theme', 'dark')}
                    className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      settings.theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Moon className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-gray-700" />
                    <span className="text-sm font-medium">Sötét</span>
                  </button>
                  
                  <button
                    onClick={() => handleTopLevelChange('theme', 'system')}
                    className={`p-3 sm:p-4 border-2 rounded-lg transition-all ${
                      settings.theme === 'system' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Monitor className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 text-gray-600" />
                    <span className="text-sm font-medium">Rendszer</span>
                  </button>
                </div>
              </div>

              {/* Display Options */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kompakt mód</label>
                    <p className="text-xs text-gray-500">Kisebb távolságok és elemek</p>
                  </div>
                  <button
                    onClick={() => handleSettingChange('display', 'compactMode', !settings.display.compactMode)}
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
                    onClick={() => handleSettingChange('display', 'showAnimations', !settings.display.showAnimations)}
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
                    onClick={() => handleSettingChange('display', 'highContrast', !settings.display.highContrast)}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600 mr-2 sm:mr-3" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Értesítések</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">E-mail értesítések</label>
                  <p className="text-xs text-gray-500">Fontos események e-mailben</p>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications', 'emailNotifications', !settings.notifications.emailNotifications)}
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
                  onClick={() => handleSettingChange('notifications', 'pushNotifications', !settings.notifications.pushNotifications)}
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
                  onClick={() => handleSettingChange('notifications', 'invoiceProcessed', !settings.notifications.invoiceProcessed)}
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
                  onClick={() => handleSettingChange('notifications', 'systemUpdates', !settings.notifications.systemUpdates)}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600 mr-2 sm:mr-3" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Adatvédelem és biztonság</h3>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adatok megőrzése</label>
                <select
                  value={settings.privacy.dataRetention}
                  onChange={(e) => handleSettingChange('privacy', 'dataRetention', e.target.value)}
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
                  onClick={() => handleSettingChange('privacy', 'analyticsEnabled', !settings.privacy.analyticsEnabled)}
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
                  onClick={() => handleSettingChange('privacy', 'crashReporting', !settings.privacy.crashReporting)}
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
              <Database className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 mr-2 sm:mr-3" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Beállítások mentése</h3>
            </div>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Automatikus mentés</label>
                  <p className="text-xs text-gray-500">Beállítások automatikus mentése</p>
                </div>
                <button
                  onClick={() => handleSettingChange('backup', 'autoBackup', !settings.backup.autoBackup)}
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
                    onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Naponta</option>
                    <option value="weekly">Hetente</option>
                    <option value="monthly">Havonta</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:gap-4">
                <button
                  onClick={handleExportSettings}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Beállítások exportálása
                </button>
                
                <label className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Beállítások importálása
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Language & Region */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center mb-3 sm:mb-4 lg:mb-6">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-indigo-600 mr-2 sm:mr-3" />
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Nyelv és régió</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nyelv</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleTopLevelChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hu">Magyar</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reset Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Beállítások visszaállítása</h3>
                <p className="text-sm text-gray-500 mt-1">Minden beállítás visszaállítása az alapértelmezett értékekre</p>
              </div>
              <button
                onClick={handleResetSettings}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Visszaállítás
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && <BackupManager />}
    </div>
  );
};
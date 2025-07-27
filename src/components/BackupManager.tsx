import React, { useState, useEffect } from 'react';
import { Download, Calendar, Clock, Database, AlertCircle, CheckCircle, RefreshCw, Play, Settings, History, X } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { SUPABASE_CONFIG } from '../config/supabase';

interface BackupSchedule {
  id: number;
  next_backup: string;
  frequency: string;
  day_of_week: number;
  hour: number;
  enabled: boolean;
  updated_at: string | null;
  created_at: string | null;
}

interface BackupHistory {
  id: string;
  backup_date: string;
  backup_filename: string;
  invoice_count: number;
  files_downloaded: number;
  backup_size_mb: number;
  google_drive_file_id: string | null;
  status: string;
  error_message?: string | null;
  backup_period_start: string;
  backup_period_end: string;
  execution_time_seconds?: number | null;
  created_at: string | null;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const BackupManager: React.FC = () => {
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const [history, setHistory] = useState<BackupHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualBackupRunning, setManualBackupRunning] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = { id, type, message };
    setNotifications(prev => [...prev, notification]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    try {
      setLoading(true);

      // Fetch backup schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('backup_schedule')
        .select('*')
        .eq('id', 1)
        .single();

      if (scheduleError && scheduleError.code !== 'PGRST116') {
        console.error('Error fetching backup schedule:', scheduleError);
      } else if (scheduleData) {
        setSchedule(scheduleData);
      }

      // Fetch backup history
      const { data: historyData, error: historyError } = await supabase
        .from('backup_history')
        .select('*')
        .order('backup_date', { ascending: false })
        .limit(10);

      if (historyError) {
        console.error('Error fetching backup history:', historyError);
      } else if (historyData) {
        setHistory(historyData);
      }

    } catch (error) {
      console.error('Error fetching backup data:', error);
      addNotification('error', 'Hiba történt a biztonsági mentés adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const runManualBackup = async () => {
    try {
      setManualBackupRunning(true);
      addNotification('info', 'Manuális biztonsági mentés indítása...');

      const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/manual-backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange: {
            start: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        }),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Unexpected response type from manual backup:', contentType, 'Response:', responseText);
        throw new Error(`A biztonsági mentés funkcióhívás váratlan tartalmat adott vissza: ${contentType || 'ismeretlen'}`);
      }

      const result = await response.json();

      if (result.success) {
        addNotification('success', 'Biztonsági mentés sikeresen elkészült!');
        await fetchBackupData(); // Refresh data
      } else {
        throw new Error(result.error || 'Biztonsági mentés sikertelen');
      }

    } catch (error) {
      console.error('Manual backup error:', error);
      addNotification('error', 'Hiba történt a biztonsági mentés során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    } finally {
      setManualBackupRunning(false);
    }
  };

  const setupBackupCron = async () => {
    try {
      const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/setup-backup-cron`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
        },
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Unexpected response type from setup backup cron:', contentType, 'Response:', responseText);
        throw new Error(`Az automatikus mentés beállítás funkcióhívás váratlan tartalmat adott vissza: ${contentType || 'ismeretlen'}`);
      }

      const result = await response.json();

      if (result.success) {
        addNotification('success', 'Automatikus biztonsági mentés beállítva!');
        await fetchBackupData();
      } else {
        throw new Error(result.error || 'Beállítás sikertelen');
      }

    } catch (error) {
      console.error('Setup backup cron error:', error);
      addNotification('error', 'Hiba történt az automatikus mentés beállítása során');
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Sikeres';
      case 'failed':
        return 'Sikertelen';
      case 'in_progress':
        return 'Folyamatban';
      default:
        return 'Ismeretlen';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-gray-600">Biztonsági mentés adatok betöltése...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
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
                      <CheckCircle className="h-4 w-4 text-green-600" />
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
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Database className="h-6 w-6 sm:h-8 sm:w-8 mr-3 text-blue-600" />
              Biztonsági mentés kezelő
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Automatikus és manuális biztonsági mentések kezelése</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <History className="h-4 w-4 mr-2" />
              Előzmények
            </button>
            
            <button
              onClick={fetchBackupData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Frissítés
            </button>
          </div>
        </div>
      </div>

      {/* Current Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            Automatikus mentés ütemezése
          </h3>
          
          {!schedule && (
            <button
              onClick={setupBackupCron}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Settings className="h-4 w-4 mr-1" />
              Beállítás
            </button>
          )}
        </div>

        {schedule ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Következő mentés</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatDate(schedule.next_backup)}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Gyakoriság</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                Kéthetente hétfőn 02:00-kor
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nincs beállítva automatikus mentés</h3>
            <p className="mt-1 text-sm text-gray-500">
              Kattintson a "Beállítás" gombra az automatikus mentések aktiválásához.
            </p>
          </div>
        )}
      </div>

      {/* Manual Backup */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Play className="h-5 w-5 mr-2 text-blue-600" />
            Manuális biztonsági mentés
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-gray-600 text-sm">
              Azonnali biztonsági mentés készítése az elmúlt 2 hét számláiról.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              A mentés tartalmazza az összes fájlt és metaadatot ZIP formátumban.
            </p>
          </div>
          
          <button
            onClick={runManualBackup}
            disabled={manualBackupRunning}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {manualBackupRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Mentés folyamatban...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Mentés indítása
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backup History */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <History className="h-5 w-5 mr-2 text-gray-600" />
            Mentési előzmények
          </h3>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dátum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fájlnév
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Számlák
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Méret
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Állapot
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(backup.backup_date)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {backup.backup_filename}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {backup.invoice_count} számla ({backup.files_downloaded} fájl)
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(backup.backup_size_mb)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                          {getStatusText(backup.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Még nincsenek mentési előzmények</h3>
              <p className="mt-1 text-sm text-gray-500">
                Az első biztonsági mentés után itt jelennek meg az előzmények.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Google Drive Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Database className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Google Drive integráció</h4>
            <p className="text-sm text-blue-700 mt-1">
              A biztonsági mentések automatikusan feltöltődnek a megadott Google Drive mappába. 
              Minden mentés tartalmazza az elmúlt 2 hét összes számláját és metaadatait ZIP formátumban.
            </p>
            <p className="text-xs text-blue-600 mt-2">
              Mappa ID: 1Lg6LG-UBYGvb4_idZclOMc6JgHgLRdrR
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
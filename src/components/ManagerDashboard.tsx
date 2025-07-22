import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, FileText, Building2, GraduationCap, Calendar, RefreshCw, AlertCircle, CheckCircle, X, Banknote, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Invoice {
  id: string;
  file_name: string;
  organization: 'alapitvany' | 'ovoda';
  uploaded_at: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  amount: number;
  invoice_type: 'bank_transfer' | 'card_cash_afterpay';
  partner: string;
  subject: string;
  invoice_date: string;
}

interface Stats {
  totalInvoices: number;
  totalAmount: number;
  alapitvanyCount: number;
  ovodaCount: number;
  bankTransferCount: number;
  cardCashCount: number;
  thisMonthCount: number;
  pendingCount: number;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const ManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalInvoices: 0,
    totalAmount: 0,
    alapitvanyCount: 0,
    ovodaCount: 0,
    bankTransferCount: 0,
    cardCashCount: 0,
    thisMonthCount: 0,
    pendingCount: 0,
  });
  
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      if (invoices) {
        calculateStats(invoices);
        setRecentInvoices(invoices.slice(0, 5));
        addNotification('success', 'Dashboard adatok sikeresen betöltve');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification('error', 'Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoices: Invoice[]) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const newStats: Stats = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      alapitvanyCount: invoices.filter(inv => inv.organization === 'alapitvany').length,
      ovodaCount: invoices.filter(inv => inv.organization === 'ovoda').length,
      bankTransferCount: invoices.filter(inv => inv.invoice_type === 'bank_transfer').length,
      cardCashCount: invoices.filter(inv => inv.invoice_type === 'card_cash_afterpay').length,
      thisMonthCount: invoices.filter(inv => new Date(inv.uploaded_at) >= thisMonth).length,
      pendingCount: invoices.filter(inv => inv.status === 'uploaded' || inv.status === 'processing').length,
    };
    
    setStats(newStats);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'uploaded':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Feldolgozva';
      case 'processing':
        return 'Feldolgozás alatt';
      case 'error':
        return 'Hiba';
      case 'uploaded':
      default:
        return 'Feltöltve';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
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
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-blue-600" />
              Áttekintés
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Számla kezelés és statisztikák</p>
          </div>
          
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-gray-600">Adatok betöltése...</span>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Összes számla</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.totalInvoices}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Banknote className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Teljes összeg</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Ez a hónap</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.thisMonthCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Feldolgozásra vár</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.pendingCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Organization Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
                Szervezetek szerinti bontás
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Alapítvány</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{stats.alapitvanyCount}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalInvoices > 0 ? Math.round((stats.alapitvanyCount / stats.totalInvoices) * 100) : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.totalInvoices > 0 ? (stats.alapitvanyCount / stats.totalInvoices) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-700">Óvoda</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{stats.ovodaCount}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalInvoices > 0 ? Math.round((stats.ovodaCount / stats.totalInvoices) * 100) : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.totalInvoices > 0 ? (stats.ovodaCount / stats.totalInvoices) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Payment Method Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                Fizetési módok
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Banki átutalás</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{stats.bankTransferCount}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalInvoices > 0 ? Math.round((stats.bankTransferCount / stats.totalInvoices) * 100) : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.totalInvoices > 0 ? (stats.bankTransferCount / stats.totalInvoices) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Kártya/Készpénz</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{stats.cardCashCount}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalInvoices > 0 ? Math.round((stats.cardCashCount / stats.totalInvoices) * 100) : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${stats.totalInvoices > 0 ? (stats.cardCashCount / stats.totalInvoices) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-600" />
              Legutóbbi számlák
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fájl
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Szervezet
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Partner
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Összeg
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Állapot
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dátum
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                            {invoice.file_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {invoice.organization === 'alapitvany' ? (
                            <>
                              <Building2 className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-sm text-gray-900">Alapítvány</span>
                            </>
                          ) : (
                            <>
                              <GraduationCap className="h-4 w-4 text-orange-600 mr-2" />
                              <span className="text-sm text-gray-900">Óvoda</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 truncate max-w-[120px]">
                          {invoice.partner || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.uploaded_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {recentInvoices.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nincsenek számlák</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Még nem töltöttek fel számlákat a rendszerbe.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
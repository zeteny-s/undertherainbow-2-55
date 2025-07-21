import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, FileText, Building2, GraduationCap, Calendar, RefreshCw, AlertCircle, CheckCircle, X, Banknote, CreditCard, Users, DollarSign, PieChart, Activity } from 'lucide-react';
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
  category?: string;
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
  avgInvoiceAmount: number;
  completedCount: number;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface WeekData {
  week: string;
  invoices: number;
  amount: number;
}

interface ExpenseData {
  category: string;
  amount: number;
  count: number;
  color: string;
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
    avgInvoiceAmount: 0,
    completedCount: 0,
  });
  
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [weekHistory, setWeekHistory] = useState<WeekData[]>([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [expenseWeekHistory, setExpenseWeekHistory] = useState<WeekData[]>([]);
  const [currentExpenseWeekIndex, setCurrentExpenseWeekIndex] = useState(0);

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
        generateWeekHistory(invoices);
        generateExpenseData(invoices);
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
    
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const completedInvoices = invoices.filter(inv => inv.status === 'completed');
    
    const newStats: Stats = {
      totalInvoices: invoices.length,
      totalAmount,
      alapitvanyCount: invoices.filter(inv => inv.organization === 'alapitvany').length,
      ovodaCount: invoices.filter(inv => inv.organization === 'ovoda').length,
      bankTransferCount: invoices.filter(inv => inv.invoice_type === 'bank_transfer').length,
      cardCashCount: invoices.filter(inv => inv.invoice_type === 'card_cash_afterpay').length,
      thisMonthCount: invoices.filter(inv => new Date(inv.uploaded_at) >= thisMonth).length,
      pendingCount: invoices.filter(inv => inv.status === 'uploaded' || inv.status === 'processing').length,
      avgInvoiceAmount: invoices.length > 0 ? totalAmount / invoices.length : 0,
      completedCount: completedInvoices.length,
    };
    
    setStats(newStats);
  };

  const generateWeekHistory = (invoices: Invoice[]) => {
    const weeks: WeekData[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.uploaded_at);
        return invDate >= weekStart && invDate <= weekEnd;
      });
      
      const weekAmount = weekInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      weeks.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        invoices: weekInvoices.length,
        amount: weekAmount
      });
    }
    
    setWeekHistory(weeks);
    setCurrentWeekIndex(0);
  };

  const generateExpenseData = (invoices: Invoice[]) => {
    const categoryColors = {
      'Bérleti díjak': '#3B82F6',
      'Közüzemi díjak': '#EF4444',
      'Szolgáltatások': '#10B981',
      'Étkeztetés költségei': '#F59E0B',
      'Személyi jellegű kifizetések': '#8B5CF6',
      'Anyagköltség': '#06B6D4',
      'Tárgyi eszközök': '#84CC16',
      'Felújítás, beruházások': '#F97316',
      'Egyéb': '#6B7280'
    };

    const categoryData: { [key: string]: { amount: number; count: number } } = {};
    
    invoices.forEach(invoice => {
      let category = invoice.category || 'Egyéb';
      if (category.endsWith(' (AI)')) {
        category = category.replace(' (AI)', '');
      }
      
      if (!categoryData[category]) {
        categoryData[category] = { amount: 0, count: 0 };
      }
      
      categoryData[category].amount += invoice.amount || 0;
      categoryData[category].count += 1;
    });

    const expenseArray: ExpenseData[] = Object.entries(categoryData).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      color: categoryColors[category as keyof typeof categoryColors] || '#6B7280'
    }));

    expenseArray.sort((a, b) => b.amount - a.amount);
    setExpenseData(expenseArray);

    // Generate expense week history
    const expenseWeeks: WeekData[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.uploaded_at);
        return invDate >= weekStart && invDate <= weekEnd;
      });
      
      const weekAmount = weekInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      expenseWeeks.push({
        week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        invoices: weekInvoices.length,
        amount: weekAmount
      });
    }
    
    setExpenseWeekHistory(expenseWeeks);
    setCurrentExpenseWeekIndex(0);
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

  const currentWeek = weekHistory[currentWeekIndex];
  const currentExpenseWeek = expenseWeekHistory[currentExpenseWeekIndex];

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
              Vezetői áttekintés
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Részletes pénzügyi és működési jelentések</p>
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
          {/* Key Performance Indicators */}
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
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">Átlag számla</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">{formatCurrency(stats.avgInvoiceAmount)}</p>
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
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Weekly Invoice Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  Heti számla trend
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                    disabled={currentWeekIndex === 0}
                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingDown className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentWeekIndex(Math.min(weekHistory.length - 1, currentWeekIndex + 1))}
                    disabled={currentWeekIndex === weekHistory.length - 1}
                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {currentWeek && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{currentWeek.invoices}</p>
                      <p className="text-sm text-gray-500">Számlák száma</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(currentWeek.amount)}</p>
                      <p className="text-sm text-gray-500">Összeg</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Hét: {currentWeek.week}</span>
                      <span>{currentWeekIndex + 1} / {weekHistory.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (currentWeek.invoices / Math.max(...weekHistory.map(w => w.invoices))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expense Categories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-green-600" />
                Kiadási kategóriák
              </h3>
              
              <div className="space-y-3">
                {expenseData.slice(0, 5).map((expense, index) => (
                  <div key={expense.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: expense.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {expense.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {expense.count} számla
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {expenseData.length > 5 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    +{expenseData.length - 5} további kategória
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Organization and Payment Method Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
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
              </div>
            </div>

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
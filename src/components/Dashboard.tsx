import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, Building2, GraduationCap, CreditCard, Banknote, Clock, CheckCircle, RefreshCw, Calendar, DollarSign, BarChart3, PieChart, Activity, ChevronLeft, ChevronRight, History, X, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Area, AreaChart, Pie } from 'recharts';
import { supabase } from '../lib/supabase';

interface Stats {
  totalInvoices: number;
  totalAmount: number;
  alapitvanyCount: number;
  ovodaCount: number;
  bankTransferCount: number;
  cardCashCount: number;
  thisMonthCount: number;
  thisMonthAmount: number;
}

interface Invoice {
  id: string;
  file_name: string;
  organization: 'alapitvany' | 'ovoda';
  uploaded_at: string;
  processed_at: string;
  status: string;
  partner: string;
  amount: number;
  invoice_type: string;
}

interface ChartData {
  monthlyData: Array<{ month: string; alapitvany: number; ovoda: number; total: number; amount: number }>;
  organizationData: Array<{ name: string; value: number; amount: number; color: string }>;
  paymentTypeData: Array<{ name: string; value: number; amount: number; color: string }>;
  weeklyTrend: Array<{ day: string; date: string; invoices: number; amount: number }>;
  expenseData: Array<{ month: string; expenses: number; count: number }>;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  data: Array<{ day: string; date: string; invoices: number; amount: number }>;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalInvoices: 0,
    totalAmount: 0,
    alapitvanyCount: 0,
    ovodaCount: 0,
    bankTransferCount: 0,
    cardCashCount: 0,
    thisMonthCount: 0,
    thisMonthAmount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [chartData, setChartData] = useState<ChartData>({
    monthlyData: [],
    organizationData: [],
    paymentTypeData: [],
    weeklyTrend: [],
    expenseData: []
  });
  const [loading, setLoading] = useState(true);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weekHistory, setWeekHistory] = useState<WeekData[]>([]);
  const [showWeekHistory, setShowWeekHistory] = useState(false);
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

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const thisMonthInvoices = invoices?.filter(inv => {
        const invDate = new Date(inv.uploaded_at);
        return invDate >= thisMonth && invDate < nextMonth;
      }) || [];

      const calculatedStats: Stats = {
        totalInvoices: invoices?.length || 0,
        totalAmount: invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0,
        alapitvanyCount: invoices?.filter(inv => inv.organization === 'alapitvany').length || 0,
        ovodaCount: invoices?.filter(inv => inv.organization === 'ovoda').length || 0,
        bankTransferCount: invoices?.filter(inv => inv.invoice_type === 'bank_transfer').length || 0,
        cardCashCount: invoices?.filter(inv => inv.invoice_type === 'card_cash_afterpay').length || 0,
        thisMonthCount: thisMonthInvoices.length,
        thisMonthAmount: thisMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      };

      const weekHistoryData = generateWeekHistory(invoices || []);
      setWeekHistory(weekHistoryData);

      const monthlyData = generateMonthlyData(invoices || []);
      const organizationData = generateOrganizationData(invoices || []);
      const paymentTypeData = generatePaymentTypeData(invoices || []);
      const weeklyTrend = weekHistoryData[0]?.data || [];
      const expenseData = generateExpenseData(invoices || []);

      setStats(calculatedStats);
      setRecentInvoices(invoices?.slice(0, 5) || []);
      setChartData({
        monthlyData,
        organizationData,
        paymentTypeData,
        weeklyTrend,
        expenseData
      });

      addNotification('success', 'Adatok sikeresen frissítve');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification('error', 'Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const generateWeekHistory = (invoices: any[]): WeekData[] => {
    const weeks: WeekData[] = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now);
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(now.getDate() - daysToMonday - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekLabel = `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;
      
      const weekData = generateWeeklyTrend(invoices, weekStart, weekEnd);
      
      weeks.push({
        weekStart,
        weekEnd,
        weekLabel,
        data: weekData
      });
    }
    
    return weeks;
  };

  const formatDateShort = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  const generateMonthlyData = (invoices: any[]) => {
    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthInvoices = invoices.filter(inv => {
        const date = new Date(inv.uploaded_at);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const alapitvanyInvoices = monthInvoices.filter(inv => inv.organization === 'alapitvany');
      const ovodaInvoices = monthInvoices.filter(inv => inv.organization === 'ovoda');
      
      return {
        month,
        alapitvany: alapitvanyInvoices.length,
        ovoda: ovodaInvoices.length,
        total: monthInvoices.length,
        amount: monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      };
    });
  };

  const generateOrganizationData = (invoices: any[]) => {
    const alapitvanyInvoices = invoices.filter(inv => inv.organization === 'alapitvany');
    const ovodaInvoices = invoices.filter(inv => inv.organization === 'ovoda');
    
    return [
      { 
        name: 'Feketerigó Alapítvány', 
        value: alapitvanyInvoices.length, 
        amount: alapitvanyInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        color: '#1e40af' 
      },
      { 
        name: 'Feketerigó Alapítványi Óvoda', 
        value: ovodaInvoices.length, 
        amount: ovodaInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        color: '#ea580c' 
      }
    ];
  };

  const generatePaymentTypeData = (invoices: any[]) => {
    const bankTransferInvoices = invoices.filter(inv => inv.invoice_type === 'bank_transfer');
    const cardCashInvoices = invoices.filter(inv => inv.invoice_type === 'card_cash_afterpay');
    
    return [
      { 
        name: 'Banki átutalás', 
        value: bankTransferInvoices.length, 
        amount: bankTransferInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        color: '#059669' 
      },
      { 
        name: 'Kártya/Készpénz/Utánvét', 
        value: cardCashInvoices.length, 
        amount: cardCashInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
        color: '#7c3aed' 
      }
    ];
  };

  const generateWeeklyTrend = (invoices: any[], weekStart: Date, weekEnd: Date) => {
    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    
    return days.map((day, index) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + index);
      
      const dayInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.uploaded_at);
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayDate);
        dayEnd.setHours(23, 59, 59, 999);
        return invDate >= dayStart && invDate <= dayEnd;
      });
      
      return {
        day,
        date: formatDateShort(dayDate),
        invoices: dayInvoices.length,
        amount: dayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
      };
    });
  };

  const generateExpenseData = (invoices: any[]) => {
    const months = ['Jan', 'Feb', 'Már', 'Ápr', 'Máj', 'Jún', 'Júl', 'Aug', 'Szep', 'Okt', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthInvoices = invoices.filter(inv => {
        const date = new Date(inv.uploaded_at);
        return date.getFullYear() === currentYear && date.getMonth() === index;
      });
      
      const expenses = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      return {
        month,
        expenses,
        count: monthInvoices.length
      };
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentWeekIndex < weekHistory.length - 1) {
      const newIndex = currentWeekIndex + 1;
      setCurrentWeekIndex(newIndex);
      setChartData(prev => ({
        ...prev,
        weeklyTrend: weekHistory[newIndex]?.data || []
      }));
    } else if (direction === 'next' && currentWeekIndex > 0) {
      const newIndex = currentWeekIndex - 1;
      setCurrentWeekIndex(newIndex);
      setChartData(prev => ({
        ...prev,
        weeklyTrend: weekHistory[newIndex]?.data || []
      }));
    }
  };

  const selectWeek = (index: number) => {
    setCurrentWeekIndex(index);
    setChartData(prev => ({
      ...prev,
      weeklyTrend: weekHistory[index]?.data || []
    }));
    setShowWeekHistory(false);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
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
      case 'uploaded':
        return 'Feltöltve';
      case 'error':
        return 'Hiba';
      default:
        return 'Ismeretlen';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
              {entry.payload.amount && (
                <span className="text-gray-500 ml-2">
                  ({formatCurrency(entry.payload.amount)})
                </span>
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const WeeklyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">{data.date}</p>
          <p className="text-sm text-green-600">
            Számlák: {data.invoices}
          </p>
          {data.amount > 0 && (
            <p className="text-sm text-gray-500">
              Összeg: {formatCurrency(data.amount)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const ExpenseTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-red-600">
            Kiadás: {formatCurrency(data.expenses)}
          </p>
          <p className="text-sm text-gray-500">
            Számlák: {data.count} db
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-gray-600">Adatok betöltése...</span>
        </div>
      </div>
    );
  }

  const currentWeek = weekHistory[currentWeekIndex];

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
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Áttekintés</h2>
            <p className="text-gray-600 text-sm sm:text-base">Számla feldolgozási statisztikák és üzleti elemzések</p>
          </div>
          {/* Hide refresh button on mobile */}
          <button
            onClick={fetchDashboardData}
            className="hidden sm:inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Frissítés
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Összes számla</p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalInvoices}</p>
              <p className="text-xs text-green-600 mt-1">+{stats.thisMonthCount} e hónapban</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-800" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Teljes összeg</p>
              <p className="text-sm sm:text-xl lg:text-3xl font-bold text-gray-900 truncate">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">Összes feldolgozott</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-800" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">E havi számlák</p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">{stats.thisMonthCount}</p>
              <p className="text-xs text-blue-600 mt-1">Aktív hónap</p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-800" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">E havi kiadás</p>
              <p className="text-sm sm:text-xl lg:text-3xl font-bold text-gray-900 truncate">{formatCurrency(stats.thisMonthAmount)}</p>
              <p className="text-xs text-red-600 mt-1">Aktuális hónap</p>
            </div>
            <div className="bg-red-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-800" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Havi számla trend
            </h3>
          </div>
          <div className="h-48 sm:h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="alapitvany" fill="#1e40af" name="Alapítvány" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ovoda" fill="#ea580c" name="Óvoda" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Expense Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600" />
              Havi kiadás trend
            </h3>
          </div>
          <div className="h-48 sm:h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip content={<ExpenseTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#dc2626" 
                  fill="#ef4444" 
                  fillOpacity={0.3}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
        {/* Organization Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <PieChart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Szervezetek szerinti megoszlás
          </h3>
          <div className="h-40 sm:h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData.organizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.organizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value} számla (${formatCurrency(props.payload.amount)})`,
                    name
                  ]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col space-y-2 mt-3 sm:mt-4">
            {chartData.organizationData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
            Fizetési módok megoszlása
          </h3>
          <div className="h-40 sm:h-48 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData.paymentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.paymentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value} számla (${formatCurrency(props.payload.amount)})`,
                    name
                  ]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col space-y-2 mt-3 sm:mt-4">
            {chartData.paymentTypeData.map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                </div>
                <p className="text-xs text-gray-600 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 lg:mb-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Heti aktivitás
          </h3>
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
            {currentWeek && (
              <span className="text-xs sm:text-sm font-medium text-gray-600 text-center sm:text-left">
                {currentWeek.weekLabel}
              </span>
            )}
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                disabled={currentWeekIndex >= weekHistory.length - 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Előző hét"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowWeekHistory(!showWeekHistory)}
                className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>Előzmények</span>
              </button>
              <button
                onClick={() => navigateWeek('next')}
                disabled={currentWeekIndex <= 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Következő hét"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Week History Dropdown */}
        {showWeekHistory && (
          <div className="mb-4 sm:mb-6 bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Heti előzmények</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {weekHistory.map((week, index) => (
                <button
                  key={index}
                  onClick={() => selectWeek(index)}
                  className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors ${
                    index === currentWeekIndex
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium truncate">{week.weekLabel}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {week.data.reduce((sum, day) => sum + day.invoices, 0)} számla
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="h-48 sm:h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<WeeklyTooltip />} />
              <Area 
                type="monotone" 
                dataKey="invoices" 
                stroke="#059669" 
                fill="#10b981" 
                fillOpacity={0.3}
                name="Számlák száma"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
          Legutóbbi számlák
        </h3>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
          {recentInvoices.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {invoice.file_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {invoice.organization === 'alapitvany' ? (
                    <Building2 className="h-4 w-4 text-blue-800" />
                  ) : (
                    <GraduationCap className="h-4 w-4 text-orange-800" />
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Partner:</span>
                  <p className="font-medium text-gray-900 truncate">
                    {invoice.partner || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Összeg:</span>
                  <p className="font-medium text-gray-900">
                    {invoice.amount ? formatCurrency(invoice.amount) : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Feltöltve:</span>
                  <p className="text-gray-900">
                    {formatDate(invoice.uploaded_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fájl név
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Szervezet
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feltöltve
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Összeg
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {invoice.file_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {invoice.organization === 'alapitvany' ? (
                        <>
                          <Building2 className="h-4 w-4 text-blue-800 mr-2" />
                          <span className="text-sm text-gray-900">Alapítvány</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-4 w-4 text-orange-800 mr-2" />
                          <span className="text-sm text-gray-900">Óvoda</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.uploaded_at)}
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.partner || '-'}
                  </td>
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.amount ? formatCurrency(invoice.amount) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {recentInvoices.length === 0 && (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Még nincsenek számlák</h3>
            <p className="mt-1 text-sm text-gray-500">
              Kezdje el a számlák feltöltésével a "Feltöltés" menüpontban.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
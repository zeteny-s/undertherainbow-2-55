import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, Building2, GraduationCap, CreditCard, Banknote, Clock, CheckCircle, RefreshCw, Calendar, DollarSign, BarChart3, PieChart, Activity, ChevronLeft, ChevronRight, History, X, AlertCircle, Settings, Grid, List, Eye, Edit3, Save, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Area, AreaChart, Pie, RadialBarChart, RadialBar, ComposedChart } from 'recharts';
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

interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'area' | 'pie' | 'radial' | 'composed';
  dataKey: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  visible: boolean;
}

interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  charts: ChartConfig[];
}

const CHART_TYPES = [
  { id: 'bar', name: 'Oszlopdiagram', icon: BarChart3, description: 'Kategóriák összehasonlítása' },
  { id: 'line', name: 'Vonaldiagram', icon: TrendingUp, description: 'Időbeli trendek megjelenítése' },
  { id: 'area', name: 'Területdiagram', icon: Activity, description: 'Kitöltött területtel' },
  { id: 'pie', name: 'Kördiagram', icon: PieChart, description: 'Arányok megjelenítése' },
  { id: 'radial', name: 'Radiális diagram', icon: RotateCcw, description: 'Körkörös megjelenítés' },
  { id: 'composed', name: 'Kombinált diagram', icon: BarChart3, description: 'Több típus egyben' }
];

const CHART_SIZES = [
  { id: 'small', name: 'Kicsi', cols: 'lg:col-span-1', height: 'h-64' },
  { id: 'medium', name: 'Közepes', cols: 'lg:col-span-2', height: 'h-80' },
  { id: 'large', name: 'Nagy', cols: 'lg:col-span-3', height: 'h-96' }
];

const DEFAULT_CHARTS: ChartConfig[] = [
  {
    id: 'monthly-trend',
    title: 'Havi számla trend',
    type: 'bar',
    dataKey: 'monthlyData',
    icon: BarChart3,
    color: '#1e40af',
    description: 'Havi számlák alakulása szervezetenként',
    size: 'medium',
    position: 1,
    visible: true
  },
  {
    id: 'expense-trend',
    title: 'Havi kiadás trend',
    type: 'area',
    dataKey: 'expenseData',
    icon: DollarSign,
    color: '#dc2626',
    description: 'Havi kiadások alakulása',
    size: 'medium',
    position: 2,
    visible: true
  },
  {
    id: 'organization-distribution',
    title: 'Szervezetek megoszlása',
    type: 'pie',
    dataKey: 'organizationData',
    icon: PieChart,
    color: '#059669',
    description: 'Számlák megoszlása szervezetek szerint',
    size: 'medium',
    position: 3,
    visible: true
  },
  {
    id: 'payment-distribution',
    title: 'Fizetési módok',
    type: 'pie',
    dataKey: 'paymentTypeData',
    icon: CreditCard,
    color: '#7c3aed',
    description: 'Fizetési módok megoszlása',
    size: 'medium',
    position: 4,
    visible: true
  },
  {
    id: 'weekly-activity',
    title: 'Heti aktivitás',
    type: 'area',
    dataKey: 'weeklyTrend',
    icon: Activity,
    color: '#059669',
    description: 'Heti számla aktivitás',
    size: 'large',
    position: 5,
    visible: true
  }
];

const PRESET_LAYOUTS: DashboardLayout[] = [
  {
    id: 'default',
    name: 'Alapértelmezett',
    description: 'Kiegyensúlyozott áttekintés minden fontos metrikával',
    charts: DEFAULT_CHARTS
  },
  {
    id: 'financial',
    name: 'Pénzügyi fókusz',
    description: 'Kiadások és pénzügyi trendek hangsúlyozása',
    charts: [
      { ...DEFAULT_CHARTS[1], position: 1, size: 'large' },
      { ...DEFAULT_CHARTS[3], position: 2, size: 'medium' },
      { ...DEFAULT_CHARTS[2], position: 3, size: 'medium' },
      { ...DEFAULT_CHARTS[0], position: 4, size: 'medium', type: 'line' }
    ]
  },
  {
    id: 'operational',
    name: 'Működési áttekintés',
    description: 'Napi működésre és aktivitásra összpontosítva',
    charts: [
      { ...DEFAULT_CHARTS[4], position: 1, size: 'large' },
      { ...DEFAULT_CHARTS[0], position: 2, size: 'medium' },
      { ...DEFAULT_CHARTS[2], position: 3, size: 'small' },
      { ...DEFAULT_CHARTS[3], position: 4, size: 'small' }
    ]
  },
  {
    id: 'executive',
    name: 'Vezetői összefoglaló',
    description: 'Magas szintű KPI-k és trendek',
    charts: [
      { ...DEFAULT_CHARTS[1], position: 1, size: 'large', type: 'composed' },
      { ...DEFAULT_CHARTS[0], position: 2, size: 'medium', type: 'line' },
      { ...DEFAULT_CHARTS[2], position: 3, size: 'medium', type: 'radial' }
    ]
  }
];

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
  
  // Chart customization state
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(PRESET_LAYOUTS[0]);
  const [customizationMode, setCustomizationMode] = useState(false);
  const [editingChart, setEditingChart] = useState<string | null>(null);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);

  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
    loadSavedLayout();
  }, []);

  const loadSavedLayout = () => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const layout = JSON.parse(savedLayout);
        setCurrentLayout(layout);
      } catch (error) {
        console.error('Error loading saved layout:', error);
      }
    }
  };

  const saveLayout = (layout: DashboardLayout) => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    setCurrentLayout(layout);
    addNotification('success', 'Dashboard elrendezés mentve!');
  };

  const updateChartConfig = (chartId: string, updates: Partial<ChartConfig>) => {
    const updatedCharts = currentLayout.charts.map(chart =>
      chart.id === chartId ? { ...chart, ...updates } : chart
    );
    
    const updatedLayout = {
      ...currentLayout,
      charts: updatedCharts
    };
    
    setCurrentLayout(updatedLayout);
  };

  const toggleChartVisibility = (chartId: string) => {
    updateChartConfig(chartId, { 
      visible: !currentLayout.charts.find(c => c.id === chartId)?.visible 
    });
  };

  const changeChartType = (chartId: string, newType: ChartConfig['type']) => {
    updateChartConfig(chartId, { type: newType });
  };

  const changeChartSize = (chartId: string, newSize: ChartConfig['size']) => {
    updateChartConfig(chartId, { size: newSize });
  };

  const resetToDefaultLayout = () => {
    setCurrentLayout(PRESET_LAYOUTS[0]);
    addNotification('info', 'Dashboard visszaállítva az alapértelmezett elrendezésre');
  };

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

  const renderChart = (config: ChartConfig) => {
    if (!config.visible) return null;

    const data = chartData[config.dataKey as keyof ChartData];
    const sizeConfig = CHART_SIZES.find(s => s.id === config.size) || CHART_SIZES[1];

    const chartContent = () => {
      switch (config.type) {
        case 'bar':
          return (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={config.dataKey === 'monthlyData' ? 'month' : 'day'} stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              {config.dataKey === 'monthlyData' && (
                <>
                  <Bar dataKey="alapitvany" fill="#1e40af" name="Alapítvány" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="ovoda" fill="#ea580c" name="Óvoda" radius={[2, 2, 0, 0]} />
                </>
              )}
              {config.dataKey === 'weeklyTrend' && (
                <Bar dataKey="invoices" fill={config.color} name="Számlák" radius={[2, 2, 0, 0]} />
              )}
            </BarChart>
          );

        case 'line':
          return (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={config.dataKey === 'monthlyData' ? 'month' : config.dataKey === 'expenseData' ? 'month' : 'day'} stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              {config.dataKey === 'monthlyData' && (
                <>
                  <Line type="monotone" dataKey="alapitvany" stroke="#1e40af" strokeWidth={3} name="Alapítvány" />
                  <Line type="monotone" dataKey="ovoda" stroke="#ea580c" strokeWidth={3} name="Óvoda" />
                </>
              )}
              {config.dataKey === 'expenseData' && (
                <Line type="monotone" dataKey="expenses" stroke={config.color} strokeWidth={3} name="Kiadások" />
              )}
              {config.dataKey === 'weeklyTrend' && (
                <Line type="monotone" dataKey="invoices" stroke={config.color} strokeWidth={3} name="Számlák" />
              )}
            </LineChart>
          );

        case 'area':
          return (
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={config.dataKey === 'expenseData' ? 'month' : 'day'} stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              {config.dataKey === 'expenseData' && (
                <Area type="monotone" dataKey="expenses" stroke="#dc2626" fill="#ef4444" fillOpacity={0.3} strokeWidth={3} />
              )}
              {config.dataKey === 'weeklyTrend' && (
                <Area type="monotone" dataKey="invoices" stroke={config.color} fill={config.color} fillOpacity={0.3} strokeWidth={3} />
              )}
            </AreaChart>
          );

        case 'pie':
          return (
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={config.size === 'small' ? 20 : 30}
                outerRadius={config.size === 'small' ? 40 : 60}
                paddingAngle={5}
                dataKey="value"
              >
                {(data as any[]).map((entry, index) => (
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
          );

        case 'radial':
          return (
            <RadialBarChart data={data} innerRadius="10%" outerRadius="80%">
              <RadialBar dataKey="value" cornerRadius={10} fill={config.color} />
              <Tooltip />
            </RadialBarChart>
          );

        case 'composed':
          return (
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={config.dataKey === 'expenseData' ? 'month' : 'month'} stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip content={<CustomTooltip />} />
              {config.dataKey === 'expenseData' && (
                <>
                  <Bar dataKey="count" fill="#3b82f6" name="Számlák száma" />
                  <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={3} name="Kiadások" />
                </>
              )}
              {config.dataKey === 'monthlyData' && (
                <>
                  <Bar dataKey="total" fill="#6b7280" name="Összes számla" />
                  <Line type="monotone" dataKey="amount" stroke="#059669" strokeWidth={3} name="Összeg" />
                </>
              )}
            </ComposedChart>
          );

        default:
          return null;
      }
    };

    return (
      <div key={config.id} className={`${sizeConfig.cols} ${customizationMode ? 'ring-2 ring-blue-200' : ''}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 h-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 flex items-center">
              <config.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              {config.title}
            </h3>
            
            {customizationMode && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingChart(editingChart === config.id ? null : config.id)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title="Diagram szerkesztése"
                >
                  <Edit3 className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => toggleChartVisibility(config.id)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title={config.visible ? 'Elrejtés' : 'Megjelenítés'}
                >
                  <Eye className={`h-4 w-4 ${config.visible ? 'text-blue-600' : 'text-gray-400'}`} />
                </button>
              </div>
            )}
          </div>
          
          {editingChart === config.id && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagram típusa</label>
                <div className="grid grid-cols-3 gap-2">
                  {CHART_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => changeChartType(config.id, type.id as ChartConfig['type'])}
                      className={`p-2 text-xs rounded-md border transition-colors ${
                        config.type === type.id 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <type.icon className="h-4 w-4 mx-auto mb-1" />
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Méret</label>
                <div className="grid grid-cols-3 gap-2">
                  {CHART_SIZES.map(size => (
                    <button
                      key={size.id}
                      onClick={() => changeChartSize(config.id, size.id as ChartConfig['size'])}
                      className={`p-2 text-xs rounded-md border transition-colors ${
                        config.size === size.id 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className={sizeConfig.height}>
            <ResponsiveContainer width="100%" height="100%">
              {chartContent()}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
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
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowLayoutSelector(!showLayoutSelector)}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Grid className="h-4 w-4 mr-2" />
                Elrendezés
              </button>
              
              {showLayoutSelector && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Előre beállított elrendezések</h3>
                    <div className="space-y-2">
                      {PRESET_LAYOUTS.map(layout => (
                        <button
                          key={layout.id}
                          onClick={() => {
                            setCurrentLayout(layout);
                            setShowLayoutSelector(false);
                            addNotification('success', `${layout.name} elrendezés alkalmazva`);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            currentLayout.id === layout.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-900">{layout.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{layout.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setCustomizationMode(!customizationMode)}
              className={`inline-flex items-center px-3 sm:px-4 py-2 border text-sm font-medium rounded-lg shadow-sm transition-colors ${
                customizationMode 
                  ? 'border-blue-500 text-blue-700 bg-blue-50' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <Settings className="h-4 w-4 mr-2" />
              {customizationMode ? 'Kész' : 'Testreszabás'}
            </button>
            
            {customizationMode && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => saveLayout(currentLayout)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Mentés
                </button>
                
                <button
                  onClick={resetToDefaultLayout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Visszaállítás
                </button>
              </div>
            )}
            
            {/* Only show refresh button on desktop */}
            {!isMobile && (
              <button
                onClick={fetchDashboardData}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Frissítés
              </button>
            )}
          </div>
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

      {/* Customizable Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
        {currentLayout.charts
          .sort((a, b) => a.position - b.position)
          .map(config => renderChart(config))}
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
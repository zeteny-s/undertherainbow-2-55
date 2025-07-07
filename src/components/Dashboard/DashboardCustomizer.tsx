import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  FileText, 
  Settings, 
  Plus, 
  Layout, 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Grip,
  X,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Grid3X3,
  Layers,
  Palette,
  Download,
  Upload
} from 'lucide-react';
import { DashboardWidget } from './DashboardWidget';
import { WidgetLibrary } from './WidgetLibrary';
import { LayoutPresets } from './LayoutPresets';
import { supabase } from '../../lib/supabase';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  data?: any;
  settings?: any;
}

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

interface DashboardLayout {
  lg: LayoutItem[];
  md: LayoutItem[];
  sm: LayoutItem[];
  xs: LayoutItem[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

const WIDGET_TYPES = {
  'monthly-trend': {
    title: 'Havi trend',
    icon: BarChart3,
    color: 'blue',
    minW: 4,
    minH: 3,
    defaultSize: { w: 6, h: 4 }
  },
  'organization-pie': {
    title: 'Szervezetek megoszlása',
    icon: PieChart,
    color: 'purple',
    minW: 3,
    minH: 3,
    defaultSize: { w: 4, h: 4 }
  },
  'payment-pie': {
    title: 'Fizetési módok',
    icon: PieChart,
    color: 'green',
    minW: 3,
    minH: 3,
    defaultSize: { w: 4, h: 4 }
  },
  'weekly-activity': {
    title: 'Heti aktivitás',
    icon: TrendingUp,
    color: 'orange',
    minW: 4,
    minH: 3,
    defaultSize: { w: 8, h: 4 }
  },
  'expense-trend': {
    title: 'Kiadás trend',
    icon: DollarSign,
    color: 'red',
    minW: 4,
    minH: 3,
    defaultSize: { w: 6, h: 4 }
  },
  'key-metrics': {
    title: 'Kulcs mutatók',
    icon: FileText,
    color: 'indigo',
    minW: 2,
    minH: 1,
    defaultSize: { w: 12, h: 2 }
  },
  'recent-invoices': {
    title: 'Legutóbbi számlák',
    icon: Calendar,
    color: 'gray',
    minW: 4,
    minH: 3,
    defaultSize: { w: 8, h: 5 }
  }
};

export const DashboardCustomizer: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [layouts, setLayouts] = useState<DashboardLayout>({
    lg: [],
    md: [],
    sm: [],
    xs: []
  });
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [showLayoutPresets, setShowLayoutPresets] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  // Load dashboard data
  useEffect(() => {
    fetchDashboardData();
    loadSavedLayout();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      // Process data for widgets
      const processedData = processInvoiceData(invoices || []);
      setDashboardData(processedData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addNotification('error', 'Hiba történt az adatok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const processInvoiceData = (invoices: any[]) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const thisMonthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.uploaded_at);
      return invDate >= thisMonth && invDate < nextMonth;
    });

    const stats = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      alapitvanyCount: invoices.filter(inv => inv.organization === 'alapitvany').length,
      ovodaCount: invoices.filter(inv => inv.organization === 'ovoda').length,
      bankTransferCount: invoices.filter(inv => inv.invoice_type === 'bank_transfer').length,
      cardCashCount: invoices.filter(inv => inv.invoice_type === 'card_cash_afterpay').length,
      thisMonthCount: thisMonthInvoices.length,
      thisMonthAmount: thisMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    };

    const monthlyData = generateMonthlyData(invoices);
    const organizationData = generateOrganizationData(invoices);
    const paymentTypeData = generatePaymentTypeData(invoices);
    const weeklyTrend = generateWeeklyTrend(invoices);
    const expenseData = generateExpenseData(invoices);
    const recentInvoices = invoices.slice(0, 5);

    return {
      stats,
      monthlyData,
      organizationData,
      paymentTypeData,
      weeklyTrend,
      expenseData,
      recentInvoices
    };
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

  const generateWeeklyTrend = (invoices: any[]) => {
    const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
    const now = new Date();
    const weekStart = new Date(now);
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
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
        date: dayDate.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' }),
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

  const loadSavedLayout = () => {
    try {
      const savedLayout = localStorage.getItem('dashboard-layout');
      const savedWidgets = localStorage.getItem('dashboard-widgets');
      
      if (savedLayout && savedWidgets) {
        setLayouts(JSON.parse(savedLayout));
        setWidgets(JSON.parse(savedWidgets));
      } else {
        // Load default layout
        loadDefaultLayout();
      }
    } catch (error) {
      console.error('Error loading saved layout:', error);
      loadDefaultLayout();
    }
  };

  const loadDefaultLayout = () => {
    const defaultWidgets: WidgetConfig[] = [
      {
        id: 'key-metrics',
        type: 'key-metrics',
        title: 'Kulcs mutatók',
        icon: FileText,
        color: 'indigo'
      },
      {
        id: 'monthly-trend',
        type: 'monthly-trend',
        title: 'Havi trend',
        icon: BarChart3,
        color: 'blue'
      },
      {
        id: 'expense-trend',
        type: 'expense-trend',
        title: 'Kiadás trend',
        icon: DollarSign,
        color: 'red'
      },
      {
        id: 'organization-pie',
        type: 'organization-pie',
        title: 'Szervezetek megoszlása',
        icon: PieChart,
        color: 'purple'
      },
      {
        id: 'payment-pie',
        type: 'payment-pie',
        title: 'Fizetési módok',
        icon: PieChart,
        color: 'green'
      },
      {
        id: 'weekly-activity',
        type: 'weekly-activity',
        title: 'Heti aktivitás',
        icon: TrendingUp,
        color: 'orange'
      },
      {
        id: 'recent-invoices',
        type: 'recent-invoices',
        title: 'Legutóbbi számlák',
        icon: Calendar,
        color: 'gray'
      }
    ];

    const defaultLayouts: DashboardLayout = {
      lg: [
        { i: 'key-metrics', x: 0, y: 0, w: 12, h: 2 },
        { i: 'monthly-trend', x: 0, y: 2, w: 6, h: 4 },
        { i: 'expense-trend', x: 6, y: 2, w: 6, h: 4 },
        { i: 'organization-pie', x: 0, y: 6, w: 4, h: 4 },
        { i: 'payment-pie', x: 4, y: 6, w: 4, h: 4 },
        { i: 'weekly-activity', x: 8, y: 6, w: 4, h: 4 },
        { i: 'recent-invoices', x: 0, y: 10, w: 12, h: 5 }
      ],
      md: [
        { i: 'key-metrics', x: 0, y: 0, w: 10, h: 2 },
        { i: 'monthly-trend', x: 0, y: 2, w: 5, h: 4 },
        { i: 'expense-trend', x: 5, y: 2, w: 5, h: 4 },
        { i: 'organization-pie', x: 0, y: 6, w: 5, h: 4 },
        { i: 'payment-pie', x: 5, y: 6, w: 5, h: 4 },
        { i: 'weekly-activity', x: 0, y: 10, w: 10, h: 4 },
        { i: 'recent-invoices', x: 0, y: 14, w: 10, h: 5 }
      ],
      sm: [
        { i: 'key-metrics', x: 0, y: 0, w: 6, h: 2 },
        { i: 'monthly-trend', x: 0, y: 2, w: 6, h: 4 },
        { i: 'expense-trend', x: 0, y: 6, w: 6, h: 4 },
        { i: 'organization-pie', x: 0, y: 10, w: 6, h: 4 },
        { i: 'payment-pie', x: 0, y: 14, w: 6, h: 4 },
        { i: 'weekly-activity', x: 0, y: 18, w: 6, h: 4 },
        { i: 'recent-invoices', x: 0, y: 22, w: 6, h: 5 }
      ],
      xs: [
        { i: 'key-metrics', x: 0, y: 0, w: 4, h: 2 },
        { i: 'monthly-trend', x: 0, y: 2, w: 4, h: 4 },
        { i: 'expense-trend', x: 0, y: 6, w: 4, h: 4 },
        { i: 'organization-pie', x: 0, y: 10, w: 4, h: 4 },
        { i: 'payment-pie', x: 0, y: 14, w: 4, h: 4 },
        { i: 'weekly-activity', x: 0, y: 18, w: 4, h: 4 },
        { i: 'recent-invoices', x: 0, y: 22, w: 4, h: 5 }
      ]
    };

    setWidgets(defaultWidgets);
    setLayouts(defaultLayouts);
  };

  const saveLayout = () => {
    try {
      localStorage.setItem('dashboard-layout', JSON.stringify(layouts));
      localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
      addNotification('success', 'Dashboard elrendezés mentve!');
    } catch (error) {
      console.error('Error saving layout:', error);
      addNotification('error', 'Hiba történt a mentés során');
    }
  };

  const resetLayout = () => {
    loadDefaultLayout();
    addNotification('info', 'Dashboard visszaállítva az alapértelmezett elrendezésre');
  };

  const onLayoutChange = useCallback((layout: LayoutItem[], allLayouts: any) => {
    setLayouts(allLayouts);
  }, []);

  const onBreakpointChange = useCallback((breakpoint: string) => {
    setCurrentBreakpoint(breakpoint);
  }, []);

  const addWidget = (widgetType: string) => {
    const widgetConfig = WIDGET_TYPES[widgetType as keyof typeof WIDGET_TYPES];
    if (!widgetConfig) return;

    const newWidget: WidgetConfig = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: widgetConfig.title,
      icon: widgetConfig.icon,
      color: widgetConfig.color
    };

    const newLayoutItem: LayoutItem = {
      i: newWidget.id,
      x: 0,
      y: 0,
      w: widgetConfig.defaultSize.w,
      h: widgetConfig.defaultSize.h,
      minW: widgetConfig.minW,
      minH: widgetConfig.minH
    };

    setWidgets(prev => [...prev, newWidget]);
    setLayouts(prev => ({
      ...prev,
      [currentBreakpoint]: [...prev[currentBreakpoint as keyof DashboardLayout], newLayoutItem]
    }));

    setShowWidgetLibrary(false);
    addNotification('success', `${widgetConfig.title} widget hozzáadva!`);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayouts(prev => ({
      lg: prev.lg.filter(item => item.i !== widgetId),
      md: prev.md.filter(item => item.i !== widgetId),
      sm: prev.sm.filter(item => item.i !== widgetId),
      xs: prev.xs.filter(item => item.i !== widgetId)
    }));
    addNotification('info', 'Widget eltávolítva');
  };

  const applyPresetLayout = (preset: any) => {
    setWidgets(preset.widgets);
    setLayouts(preset.layouts);
    setShowLayoutPresets(false);
    addNotification('success', `${preset.name} elrendezés alkalmazva!`);
  };

  const exportLayout = () => {
    const exportData = {
      widgets,
      layouts,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-layout-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);

    addNotification('success', 'Dashboard elrendezés exportálva!');
  };

  const importLayout = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (importData.widgets && importData.layouts) {
          setWidgets(importData.widgets);
          setLayouts(importData.layouts);
          addNotification('success', 'Dashboard elrendezés importálva!');
        } else {
          throw new Error('Invalid layout file format');
        }
      } catch (error) {
        addNotification('error', 'Hibás elrendezés fájl');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getBreakpointIcon = (breakpoint: string) => {
    switch (breakpoint) {
      case 'lg': return Monitor;
      case 'md': return Tablet;
      case 'sm': return Smartphone;
      case 'xs': return Smartphone;
      default: return Monitor;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-lg text-gray-600">Dashboard betöltése...</span>
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
                      <Settings className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                  {notification.type === 'error' && (
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  {notification.type === 'info' && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <Settings className="h-4 w-4 text-blue-600" />
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
              {isCustomizing ? 'Dashboard testreszabása' : 'Áttekintés'}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {isCustomizing 
                ? 'Húzza és méretezze át a widgeteket, vagy válasszon előre definiált elrendezést'
                : 'Számla feldolgozási statisztikák és üzleti elemzések'
              }
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Breakpoint Indicator */}
            {isCustomizing && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg">
                {React.createElement(getBreakpointIcon(currentBreakpoint), { 
                  className: "h-4 w-4 text-gray-600" 
                })}
                <span className="text-xs font-medium text-gray-600 uppercase">
                  {currentBreakpoint}
                </span>
              </div>
            )}

            {isCustomizing ? (
              <>
                <button
                  onClick={() => setShowLayoutPresets(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Layout className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sablonok</span>
                </button>
                
                <button
                  onClick={() => setShowWidgetLibrary(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Widget</span>
                </button>

                <div className="flex items-center space-x-2">
                  <label className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Import</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importLayout}
                      className="sr-only"
                    />
                  </label>
                  
                  <button
                    onClick={exportLayout}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>

                <button
                  onClick={resetLayout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                <button
                  onClick={saveLayout}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Mentés
                </button>

                <button
                  onClick={() => setIsCustomizing(false)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Kész
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsCustomizing(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Testreszabás
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className={`transition-all duration-300 ${isDragging ? 'cursor-grabbing' : ''}`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={onLayoutChange}
          onBreakpointChange={onBreakpointChange}
          onDragStart={() => setIsDragging(true)}
          onDragStop={() => setIsDragging(false)}
          onResizeStart={() => setIsDragging(true)}
          onResizeStop={() => setIsDragging(false)}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          rowHeight={60}
          isDraggable={isCustomizing}
          isResizable={isCustomizing}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          transformScale={1}
          compactType="vertical"
          preventCollision={false}
          autoSize={true}
          draggableHandle=".drag-handle"
          resizeHandles={['se']}
        >
          {widgets.map((widget) => (
            <div key={widget.id} className="widget-container">
              <DashboardWidget
                widget={widget}
                data={dashboardData}
                isCustomizing={isCustomizing}
                onRemove={() => removeWidget(widget.id)}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibrary
          onAddWidget={addWidget}
          onClose={() => setShowWidgetLibrary(false)}
          availableTypes={WIDGET_TYPES}
        />
      )}

      {/* Layout Presets Modal */}
      {showLayoutPresets && (
        <LayoutPresets
          onApplyPreset={applyPresetLayout}
          onClose={() => setShowLayoutPresets(false)}
        />
      )}
    </div>
  );
};
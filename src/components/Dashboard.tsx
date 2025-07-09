import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, FileText, DollarSign, Building2, GraduationCap, CreditCard, Banknote, Calendar, Users, Plus, X, Move, Settings, RotateCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { supabase } from '../lib/supabase';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardStats {
  totalInvoices: number;
  totalAmount: number;
  alapitvanyCount: number;
  ovodaCount: number;
  bankTransferCount: number;
  cardCashCount: number;
  thisMonthCount: number;
  pendingCount: number;
}

interface PartnerExpense {
  partner: string;
  amount: number;
  invoiceCount: number;
}

interface MonthlyData {
  month: string;
  amount: number;
  count: number;
}

interface Widget {
  id: string;
  title: string;
  type: 'stat' | 'chart';
  component: React.ComponentType<any>;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  data?: any;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalAmount: 0,
    alapitvanyCount: 0,
    ovodaCount: 0,
    bankTransferCount: 0,
    cardCashCount: 0,
    thisMonthCount: 0,
    pendingCount: 0
  });

  const [partnerExpenses, setPartnerExpenses] = useState<PartnerExpense[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all invoices
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('status', 'completed');

      if (error) throw error;

      if (invoices) {
        // Calculate basic stats
        const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
        const alapitvanyCount = invoices.filter(inv => inv.organization === 'alapitvany').length;
        const ovodaCount = invoices.filter(inv => inv.organization === 'ovoda').length;
        const bankTransferCount = invoices.filter(inv => inv.invoice_type === 'bank_transfer').length;
        const cardCashCount = invoices.filter(inv => inv.invoice_type === 'card_cash_afterpay').length;

        // This month's invoices
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthCount = invoices.filter(inv => 
          new Date(inv.uploaded_at) >= thisMonth
        ).length;

        setStats({
          totalInvoices: invoices.length,
          totalAmount,
          alapitvanyCount,
          ovodaCount,
          bankTransferCount,
          cardCashCount,
          thisMonthCount,
          pendingCount: 0 // No pending invoices in completed status
        });

        // Calculate partner expenses (top 5)
        const partnerMap = new Map<string, { amount: number; count: number }>();
        
        invoices.forEach(invoice => {
          if (invoice.partner && invoice.amount) {
            const existing = partnerMap.get(invoice.partner) || { amount: 0, count: 0 };
            partnerMap.set(invoice.partner, {
              amount: existing.amount + invoice.amount,
              count: existing.count + 1
            });
          }
        });

        const topPartners = Array.from(partnerMap.entries())
          .map(([partner, data]) => ({
            partner: partner.length > 20 ? partner.substring(0, 20) + '...' : partner,
            amount: data.amount,
            invoiceCount: data.count
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        setPartnerExpenses(topPartners);

        // Calculate monthly data for the last 6 months
        const monthlyMap = new Map<string, { amount: number; count: number }>();
        const last6Months = [];
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
          const monthName = date.toLocaleDateString('hu-HU', { month: 'short', year: '2-digit' });
          last6Months.push({ key: monthKey, name: monthName });
          monthlyMap.set(monthKey, { amount: 0, count: 0 });
        }

        invoices.forEach(invoice => {
          if (invoice.uploaded_at) {
            const monthKey = invoice.uploaded_at.slice(0, 7);
            if (monthlyMap.has(monthKey)) {
              const existing = monthlyMap.get(monthKey)!;
              monthlyMap.set(monthKey, {
                amount: existing.amount + (invoice.amount || 0),
                count: existing.count + 1
              });
            }
          }
        });

        const monthlyChartData = last6Months.map(month => ({
          month: month.name,
          amount: Math.round(monthlyMap.get(month.key)?.amount || 0),
          count: monthlyMap.get(month.key)?.count || 0
        }));

        setMonthlyData(monthlyChartData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Widget Components
  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; subtitle?: string }> = 
    ({ title, value, icon, color, subtitle }) => (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    );

  const PartnerExpensesChart: React.FC = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Legmagasabb Partneri Kiadások</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={partnerExpenses} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="partner" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              interval={0}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              fontSize={12}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Összeg']}
              labelFormatter={(label) => `Partner: ${label}`}
            />
            <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const MonthlyTrendChart: React.FC = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Havi Kiadások Trendje</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} fontSize={12} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Összeg']} />
            <Area type="monotone" dataKey="amount" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const OrganizationChart: React.FC = () => {
    const orgData = [
      { name: 'Alapítvány', value: stats.alapitvanyCount, color: '#3B82F6' },
      { name: 'Óvoda', value: stats.ovodaCount, color: '#F59E0B' }
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Szervezetek Megoszlása</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={orgData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {orgData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4 mt-2">
          {orgData.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PaymentMethodChart: React.FC = () => {
    const paymentData = [
      { name: 'Banki átutalás', value: stats.bankTransferCount, color: '#10B981' },
      { name: 'Kártya/Készpénz', value: stats.cardCashCount, color: '#8B5CF6' }
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fizetési Módok</h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4 mt-2">
          {paymentData.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: item.color }}></div>
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Define all available widgets with proper sizing
  const availableWidgets: Widget[] = [
    {
      id: 'total-invoices',
      title: 'Összes Számla',
      type: 'stat',
      component: () => <StatCard 
        title="Összes Számla" 
        value={stats.totalInvoices} 
        icon={<FileText className="h-5 w-5 text-blue-600" />} 
        color="bg-blue-100" 
      />,
      defaultSize: { w: 2, h: 2 },
      minSize: { w: 2, h: 2 }
    },
    {
      id: 'total-amount',
      title: 'Összes Összeg',
      type: 'stat',
      component: () => <StatCard 
        title="Összes Összeg" 
        value={formatCurrency(stats.totalAmount)} 
        icon={<DollarSign className="h-5 w-5 text-green-600" />} 
        color="bg-green-100" 
      />,
      defaultSize: { w: 2, h: 2 },
      minSize: { w: 2, h: 2 }
    },
    {
      id: 'this-month',
      title: 'Ez a Hónap',
      type: 'stat',
      component: () => <StatCard 
        title="Ez a Hónap" 
        value={stats.thisMonthCount} 
        icon={<Calendar className="h-5 w-5 text-purple-600" />} 
        color="bg-purple-100" 
        subtitle="új számla"
      />,
      defaultSize: { w: 2, h: 2 },
      minSize: { w: 2, h: 2 }
    },
    {
      id: 'partner-expenses',
      title: 'Partneri Kiadások',
      type: 'chart',
      component: PartnerExpensesChart,
      defaultSize: { w: 4, h: 4 },
      minSize: { w: 3, h: 3 }
    },
    {
      id: 'monthly-trend',
      title: 'Havi Trend',
      type: 'chart',
      component: MonthlyTrendChart,
      defaultSize: { w: 4, h: 4 },
      minSize: { w: 3, h: 3 }
    },
    {
      id: 'organization-split',
      title: 'Szervezetek',
      type: 'chart',
      component: OrganizationChart,
      defaultSize: { w: 3, h: 4 },
      minSize: { w: 2, h: 3 }
    },
    {
      id: 'payment-methods',
      title: 'Fizetési Módok',
      type: 'chart',
      component: PaymentMethodChart,
      defaultSize: { w: 3, h: 4 },
      minSize: { w: 2, h: 3 }
    }
  ];

  // Default layout
  const getDefaultLayout = (): Layout[] => [
    { i: 'total-invoices', x: 0, y: 0, w: 2, h: 2 },
    { i: 'total-amount', x: 2, y: 0, w: 2, h: 2 },
    { i: 'this-month', x: 4, y: 0, w: 2, h: 2 },
    { i: 'partner-expenses', x: 0, y: 2, w: 4, h: 4 },
    { i: 'monthly-trend', x: 4, y: 2, w: 4, h: 4 },
    { i: 'organization-split', x: 0, y: 6, w: 3, h: 4 },
    { i: 'payment-methods', x: 3, y: 6, w: 3, h: 4 }
  ];

  const [activeWidgets, setActiveWidgets] = useState<string[]>([
    'total-invoices', 'total-amount', 'this-month', 'partner-expenses', 
    'monthly-trend', 'organization-split', 'payment-methods'
  ]);

  const handleLayoutChange = (layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
  };

  const resetLayout = () => {
    setLayouts({});
  };

  const toggleWidget = (widgetId: string) => {
    setActiveWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-lg text-gray-600">Adatok betöltése...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-blue-600" />
              Áttekintés
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">Számla kezelés statisztikák és elemzések</p>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 border text-sm font-medium rounded-lg transition-colors ${
                editMode 
                  ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {editMode ? (
                <>
                  <X className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Szerkesztés befejezése</span>
                  <span className="sm:hidden">Kész</span>
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Testreszabás</span>
                  <span className="sm:hidden">Szerkeszt</span>
                </>
              )}
            </button>
            
            {editMode && (
              <button
                onClick={resetLayout}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Alaphelyzet</span>
                <span className="sm:hidden">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Widget Selection Panel */}
      {editMode && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Widgetek kezelése</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableWidgets.map(widget => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  activeWidgets.includes(widget.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{widget.title}</span>
                  {activeWidgets.includes(widget.id) ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 8, md: 6, sm: 4, xs: 2, xxs: 2 }}
          rowHeight={80}
          isDraggable={editMode}
          isResizable={editMode}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
        >
          {activeWidgets.map(widgetId => {
            const widget = availableWidgets.find(w => w.id === widgetId);
            if (!widget) return null;

            const Component = widget.component;
            return (
              <div key={widgetId} className="widget-container">
                {editMode && (
                  <div className="absolute top-2 right-2 z-10 flex space-x-1">
                    <div className="bg-white rounded p-1 shadow-sm border">
                      <Move className="h-3 w-3 text-gray-500" />
                    </div>
                    <button
                      onClick={() => toggleWidget(widgetId)}
                      className="bg-red-500 text-white rounded p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <Component />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>

      <style jsx>{`
        .dashboard-grid .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }
        
        .dashboard-grid .react-grid-item.cssTransforms {
          transition-property: transform;
        }
        
        .dashboard-grid .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBkPSJtMTUgMTJjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0wIDRjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0wIDRjMCAuNTUyLS40NDggMS0xIDFzLTEtLjQ0OC0xLTEgLjQ0OC0xIDEtMSAxIC40NDggMSAxem0tNS00YzAtLjU1Mi40NDgtMSAxLTFzMSAuNDQ4IDEgMS0uNDQ4IDEtMSAxLTEtLjQ0OC0xLTF6bTAgNGMwLS41NTIuNDQ4LTEgMS0xczEgLjQ0OCAxIDEtLjQ0OCAxLTEgMS0xLS40NDgtMS0xem0wIDRjMC0uNTUyLjQ0OC0xIDEtMXMxIC40NDggMSAxLS40NDggMS0xIDEtMS0uNDQ4LTEtMXptLTUtNGMwLS41NTIuNDQ4LTEgMS0xczEgLjQ0OCAxIDEtLjQ0OCAxLTEgMS0xLS40NDgtMS0xem0wIDRjMC0uNTUyLjQ0OC0xIDEtMXMxIC40NDggMSAxLS40NDggMS0xIDEtMS0uNDQ4LTEtMXoiLz4KPHN2Zz4K') no-repeat;
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }

        .widget-container {
          position: relative;
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
};
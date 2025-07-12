import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Calendar,
  Clock,
  Building2,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Invoice {
  id: string;
  file_name: string;
  organization: 'alapitvany' | 'ovoda';
  uploaded_at: string;
  amount: number | null;
  partner: string | null;
  invoice_date: string | null;
  payment_method: string | null;
}

interface DashboardProps {
  invoices: Invoice[];
}

export const Dashboard: React.FC<DashboardProps> = ({ invoices = [] }) => {
  const [currentExpenseWeekIndex, setCurrentExpenseWeekIndex] = useState(0);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate metrics
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
  const alapitvanyCount = invoices.filter(inv => inv.organization === 'alapitvany').length;
  const ovodaCount = invoices.filter(inv => inv.organization === 'ovoda').length;

  // Recent invoices (last 5)
  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
      .slice(0, 5);
  }, [invoices]);

  // Monthly trend data
  const monthlyData = useMemo(() => {
    const monthlyStats = invoices.reduce((acc, invoice) => {
      const month = new Date(invoice.uploaded_at).toLocaleDateString('hu-HU', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!acc[month]) {
        acc[month] = { month, count: 0, amount: 0 };
      }
      acc[month].count++;
      acc[month].amount += invoice.amount || 0;
      return acc;
    }, {} as Record<string, { month: string; count: number; amount: number }>);

    return Object.values(monthlyStats).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [invoices]);

  // Top partners data
  const topPartnersData = useMemo(() => {
    const partnerStats = invoices.reduce((acc, invoice) => {
      const partner = invoice.partner || 'Ismeretlen';
      if (!acc[partner]) {
        acc[partner] = { partner, count: 0, amount: 0 };
      }
      acc[partner].count++;
      acc[partner].amount += invoice.amount || 0;
      return acc;
    }, {} as Record<string, { partner: string; count: number; amount: number }>);

    return Object.values(partnerStats)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [invoices]);

  // Weekly data for expense trend
  const weekHistory = useMemo(() => {
    const weeks = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeks.push({
        start: weekStart.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
        end: weekEnd.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
        startDate: weekStart,
        endDate: weekEnd
      });
    }
    return weeks;
  }, []);

  const weeklyExpenseData = useMemo(() => {
    const currentWeek = weekHistory[currentExpenseWeekIndex];
    if (!currentWeek) return [];

    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeek.startDate);
      day.setDate(currentWeek.startDate.getDate() + i);
      
      const dayInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.uploaded_at);
        return invoiceDate.toDateString() === day.toDateString();
      });

      const totalAmount = dayInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      weekData.push({
        day: day.toLocaleDateString('hu-HU', { weekday: 'short' }),
        amount: totalAmount / 1000 // Convert to thousands
      });
    }
    return weekData;
  }, [invoices, currentExpenseWeekIndex, weekHistory]);

  // Weekly data for activity
  const weeklyData = useMemo(() => {
    const currentWeek = weekHistory[currentWeekIndex];
    if (!currentWeek) return [];

    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeek.startDate);
      day.setDate(currentWeek.startDate.getDate() + i);
      
      const dayInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.uploaded_at);
        return invoiceDate.toDateString() === day.toDateString();
      });

      weekData.push({
        day: day.toLocaleDateString('hu-HU', { weekday: 'short' }),
        count: dayInvoices.length
      });
    }
    return weekData;
  }, [invoices, currentWeekIndex, weekHistory]);

  // Organization distribution
  const organizationData = [
    { name: 'Alapítvány', value: alapitvanyCount, color: '#1e40af' },
    { name: 'Óvoda', value: ovodaCount, color: '#ea580c' }
  ];

  // Payment method distribution
  const paymentMethodData = useMemo(() => {
    const methodStats = invoices.reduce((acc, invoice) => {
      const method = invoice.payment_method || 'Ismeretlen';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return Object.entries(methodStats).map(([method, count], index) => ({
      name: method,
      value: count,
      color: colors[index % colors.length]
    }));
  }, [invoices]);

  const navigateExpenseWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentExpenseWeekIndex < weekHistory.length - 1) {
      setCurrentExpenseWeekIndex(prev => prev + 1);
    } else if (direction === 'next' && currentExpenseWeekIndex > 0) {
      setCurrentExpenseWeekIndex(prev => prev - 1);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentWeekIndex < weekHistory.length - 1) {
      setCurrentWeekIndex(prev => prev + 1);
    } else if (direction === 'next' && currentWeekIndex > 0) {
      setCurrentWeekIndex(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Összes számla</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{totalInvoices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Összes érték</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-800" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Alapítvány</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{alapitvanyCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-orange-800" />
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Óvoda</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{ovodaCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend and Top Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Havi számla trend
          </h3>
          <div className="h-48 sm:h-64 lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  formatter={(value: number) => [value, 'Számlák száma']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Partners */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Legmagasabb partneri kiadások
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPartnersData} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="partner" 
                  tick={{ fontSize: 9 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 9 }}
                  tickLine={{ stroke: '#e0e0e0' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Összeg']}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Expense Trend Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-0 flex items-center">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-red-600" />
            Heti kiadás trend
          </h3>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-xs sm:text-sm text-gray-500">
              {weekHistory[currentExpenseWeekIndex]?.start} - {weekHistory[currentExpenseWeekIndex]?.end}
            </span>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => navigateExpenseWeek('prev')}
                disabled={currentExpenseWeekIndex >= weekHistory.length - 1}
                className="p-1 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Előző hét"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <span className="text-xs sm:text-sm text-gray-600 min-w-[60px] sm:min-w-[80px] text-center">
                {weekHistory.length - currentExpenseWeekIndex}. hét
              </span>
              <button
                onClick={() => navigateExpenseWeek('next')}
                disabled={currentExpenseWeekIndex <= 0}
                className="p-1 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Következő hét"
              >
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11 }}
                tickLine={{ stroke: '#e0e0e0' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={{ stroke: '#e0e0e0' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`${(value * 1000).toLocaleString('hu-HU')} Ft`, 'Kiadás']}
                labelFormatter={(label) => `${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#ef4444" 
                fill="url(#expenseGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Organization Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6">
            Szervezetek szerinti megoszlás
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={organizationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {organizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Számlák száma']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6">
            Fizetési módok megoszlása
          </h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Számlák száma']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 lg:mb-6 flex items-center">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
          Legutóbbi számlák
        </h3>

        {/* Mobile List View */}
        <div className="sm:hidden space-y-3">
          {recentInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-50 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {invoice.file_name}
                  </span>
                </div>
                <div className="flex-shrink-0">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fájl
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Szervezet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Összeg
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feltöltve
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {invoice.file_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.partner || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.amount ? formatCurrency(invoice.amount) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.uploaded_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Activity Chart - Last Position */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-0 flex items-center">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Heti aktivitás
          </h3>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-xs sm:text-sm text-gray-500">
              {weekHistory[currentWeekIndex]?.start} - {weekHistory[currentWeekIndex]?.end}
            </span>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                disabled={currentWeekIndex >= weekHistory.length - 1}
                className="p-1 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Előző hét"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <span className="text-xs sm:text-sm text-gray-600 min-w-[60px] sm:min-w-[80px] text-center">
                {weekHistory.length - currentWeekIndex}. hét
              </span>
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
        
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11 }}
                tickLine={{ stroke: '#e0e0e0' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={{ stroke: '#e0e0e0' }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [value, 'Számlák száma']}
                labelFormatter={(label) => `${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#10b981" 
                fill="url(#colorGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { Grip, X, Maximize2, Settings, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Cell, LineChart, Line, Area, AreaChart, Pie } from 'recharts';

interface WidgetProps {
  widget: {
    id: string;
    type: string;
    title: string;
    icon: React.ComponentType<any>;
    color: string;
    gradient: string;
  };
  data: any;
  isCustomizing: boolean;
  onRemove: () => void;
}

export const DashboardWidget: React.FC<WidgetProps> = ({ widget, data, isCustomizing, onRemove }) => {
  const formatCurrency = (amount: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-gray-200 rounded-xl shadow-xl">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm flex items-center">
              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
              {entry.name}: <span className="font-medium ml-1">{entry.value}</span>
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

  const renderWidgetContent = () => {
    if (!data) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-8 h-8 border-2 border-transparent border-r-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
      );
    }

    switch (widget.type) {
      case 'key-metrics':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col justify-center border border-blue-200/50 hover:from-blue-500/20 hover:to-blue-600/30 transition-all duration-300">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {data.stats.totalInvoices}
              </div>
              <div className="text-sm text-blue-700 font-medium">Összes számla</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col justify-center border border-emerald-200/50 hover:from-emerald-500/20 hover:to-emerald-600/30 transition-all duration-300">
              <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent truncate">
                {formatCurrency(data.stats.totalAmount)}
              </div>
              <div className="text-sm text-emerald-700 font-medium">Teljes összeg</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col justify-center border border-orange-200/50 hover:from-orange-500/20 hover:to-orange-600/30 transition-all duration-300">
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                {data.stats.thisMonthCount}
              </div>
              <div className="text-sm text-orange-700 font-medium">E havi számlák</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/20 backdrop-blur-sm rounded-2xl p-4 flex flex-col justify-center border border-red-200/50 hover:from-red-500/20 hover:to-red-600/30 transition-all duration-300">
              <div className="text-lg font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent truncate">
                {formatCurrency(data.stats.thisMonthAmount)}
              </div>
              <div className="text-sm text-red-700 font-medium">E havi kiadás</div>
            </div>
          </div>
        );

      case 'monthly-trend':
        return (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="alapitvanyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="ovodaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} fontWeight={500} />
                <YAxis stroke="#64748b" fontSize={12} fontWeight={500} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="alapitvany" fill="url(#alapitvanyGradient)" name="Alapítvány" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ovoda" fill="url(#ovodaGradient)" name="Óvoda" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'expense-trend':
        return (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.expenseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} fontWeight={500} />
                <YAxis stroke="#64748b" fontSize={12} fontWeight={500} />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value: any) => [formatCurrency(value), 'Kiadás']}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#dc2626" 
                  fill="url(#expenseGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'organization-pie':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="orgGradient1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="orgGradient2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={data.organizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.organizationData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#orgGradient1)' : 'url(#orgGradient2)'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} számla (${formatCurrency(props.payload.amount)})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {data.organizationData.map((item: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${index === 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'}`}></div>
                    <span className="text-lg font-bold text-gray-900">{item.value}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium truncate max-w-[120px]">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'payment-pie':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="payGradient1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="payGradient2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={data.paymentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.paymentTypeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#payGradient1)' : 'url(#payGradient2)'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<CustomTooltip />}
                    formatter={(value: any, name: string, props: any) => [
                      `${value} számla (${formatCurrency(props.payload.amount)})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4">
              {data.paymentTypeData.map((item: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${index === 0 ? 'from-emerald-500 to-emerald-600' : 'from-purple-500 to-purple-600'}`}></div>
                    <span className="text-lg font-bold text-gray-900">{item.value}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium truncate max-w-[120px]">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'weekly-activity':
        return (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="weeklyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} fontWeight={500} />
                <YAxis stroke="#64748b" fontSize={12} fontWeight={500} />
                <Tooltip 
                  content={<CustomTooltip />}
                  formatter={(value: any) => [`${value} számla`, 'Számlák száma']}
                />
                <Area 
                  type="monotone" 
                  dataKey="invoices" 
                  stroke="#059669" 
                  fill="url(#weeklyGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'recent-invoices':
        return (
          <div className="h-full overflow-hidden">
            {data.recentInvoices && data.recentInvoices.length > 0 ? (
              <div className="h-full overflow-y-auto space-y-3">
                {data.recentInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-gray-100/80 backdrop-blur-sm rounded-xl hover:from-gray-100/80 hover:to-gray-200/80 transition-all duration-200 border border-gray-200/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {invoice.file_name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {invoice.partner || 'Ismeretlen partner'}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {formatCurrency(invoice.amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(invoice.uploaded_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <widget.icon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">Nincsenek számlák</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <widget.icon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">Widget típus: {widget.type}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 h-full flex flex-col overflow-hidden transition-all duration-300 ${
      isCustomizing ? 'hover:shadow-xl hover:border-blue-300/50 hover:bg-white/90' : 'hover:shadow-xl'
    }`}>
      {/* Widget Header */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-100/50 ${
        isCustomizing ? 'bg-gradient-to-r from-gray-50/80 to-gray-100/80' : 'bg-white/50'
      }`}>
        <div className="flex items-center space-x-3">
          {isCustomizing && (
            <div className="drag-handle cursor-grab hover:cursor-grabbing p-2 rounded-xl hover:bg-white/80 transition-all duration-200">
              <Grip className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className={`p-3 rounded-xl bg-gradient-to-r ${widget.gradient} shadow-sm`}>
            <widget.icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 truncate">
            {widget.title}
          </h3>
        </div>
        
        {isCustomizing && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onRemove}
              className="p-2 rounded-xl hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all duration-200"
              title="Widget eltávolítása"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {renderWidgetContent()}
      </div>
    </div>
  );
};
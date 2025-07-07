import React from 'react';
import { Grip, X, Maximize2, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Cell, LineChart, Line, Area, AreaChart, Pie } from 'recharts';

interface WidgetProps {
  widget: {
    id: string;
    type: string;
    title: string;
    icon: React.ComponentType<any>;
    color: string;
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

  const renderWidgetContent = () => {
    if (!data) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (widget.type) {
      case 'key-metrics':
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 flex flex-col justify-center">
              <div className="text-2xl font-bold text-blue-900">{data.stats.totalInvoices}</div>
              <div className="text-sm text-blue-700">Összes számla</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 flex flex-col justify-center">
              <div className="text-lg font-bold text-green-900 truncate">{formatCurrency(data.stats.totalAmount)}</div>
              <div className="text-sm text-green-700">Teljes összeg</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 flex flex-col justify-center">
              <div className="text-2xl font-bold text-orange-900">{data.stats.thisMonthCount}</div>
              <div className="text-sm text-orange-700">E havi számlák</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 flex flex-col justify-center">
              <div className="text-lg font-bold text-red-900 truncate">{formatCurrency(data.stats.thisMonthAmount)}</div>
              <div className="text-sm text-red-700">E havi kiadás</div>
            </div>
          </div>
        );

      case 'monthly-trend':
        return (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="alapitvany" fill="#1e40af" name="Alapítvány" radius={[2, 2, 0, 0]} />
                <Bar dataKey="ovoda" fill="#ea580c" name="Óvoda" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'expense-trend':
        return (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.expenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    formatCurrency(value),
                    'Kiadás'
                  ]}
                />
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
        );

      case 'organization-pie':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.organizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.organizationData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${value} számla (${formatCurrency(props.payload.amount)})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-2">
              {data.organizationData.map((item: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="flex items-center space-x-1 mb-1">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate max-w-[100px]">{item.name}</p>
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
                  <Pie
                    data={data.paymentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.paymentTypeData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => [
                      `${value} számla (${formatCurrency(props.payload.amount)})`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-2">
              {data.paymentTypeData.map((item: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="flex items-center space-x-1 mb-1">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                  <p className="text-xs text-gray-600 truncate max-w-[100px]">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'weekly-activity':
        return (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => [
                    `${value} számla`,
                    'Számlák száma'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="invoices" 
                  stroke="#059669" 
                  fill="#10b981" 
                  fillOpacity={0.3}
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
              <div className="h-full overflow-y-auto">
                <div className="space-y-3">
                  {data.recentInvoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {invoice.file_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {invoice.partner || 'Ismeretlen partner'}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(invoice.uploaded_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <widget.icon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nincsenek számlák</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <widget.icon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Widget típus: {widget.type}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden transition-all duration-200 ${
      isCustomizing ? 'hover:shadow-md hover:border-blue-300' : ''
    }`}>
      {/* Widget Header */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-100 ${
        isCustomizing ? 'bg-gray-50' : 'bg-white'
      }`}>
        <div className="flex items-center space-x-3">
          {isCustomizing && (
            <div className="drag-handle cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-200 transition-colors">
              <Grip className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className={`p-2 rounded-lg bg-${widget.color}-100`}>
            <widget.icon className={`h-4 w-4 text-${widget.color}-600`} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {widget.title}
          </h3>
        </div>
        
        {isCustomizing && (
          <div className="flex items-center space-x-1">
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
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

      {/* Resize Handle (only visible when customizing) */}
      {isCustomizing && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
          <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-400 rounded-full opacity-50 hover:opacity-100 transition-opacity"></div>
        </div>
      )}
    </div>
  );
};
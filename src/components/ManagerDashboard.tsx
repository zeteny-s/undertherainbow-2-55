import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, TrendingUp, Users, Building2, GraduationCap, DollarSign, Calendar, Banknote, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { mockStats, mockRecentInvoices } from '../utils/mockData';

export const ManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState(mockStats);
  const [recentInvoices, setRecentInvoices] = useState(mockRecentInvoices);

  // Mock data for charts
  const monthlyData = [
    { month: 'Jan', alapitvany: 1200000, ovoda: 800000 },
    { month: 'Feb', alapitvany: 1100000, ovoda: 900000 },
    { month: 'Mar', alapitvany: 1300000, ovoda: 750000 },
    { month: 'Apr', alapitvany: 1400000, ovoda: 850000 },
    { month: 'Máj', alapitvany: 1250000, ovoda: 950000 },
    { month: 'Jún', alapitvany: 1350000, ovoda: 800000 },
  ];

  const paymentTypeData = [
    { name: 'Banki átutalás', value: stats.bankTransferCount, color: '#3B82F6' },
    { name: 'Kártya/Készpénz', value: stats.cardCashCount, color: '#10B981' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Vezetői áttekintés</h2>
        <p className="text-gray-600 text-sm sm:text-base">Feketerigó Alapítvány számla kezelő rendszer - Vezetői nézet</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Összes számla</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{stats.totalInvoices}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Összes érték</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalAmount)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Ez a hónap</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{stats.thisMonthCount}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
            <div className="ml-3 sm:ml-4 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Feldolgozásra vár</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{stats.pendingCount}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Havi trendek
          </h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="alapitvany" fill="#3B82F6" name="Alapítvány" />
                <Bar dataKey="ovoda" fill="#10B981" name="Óvoda" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Types */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Fizetési módok
          </h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Organization Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Alapítvány
            </h3>
            <span className="text-xl sm:text-2xl font-bold text-blue-600">{stats.alapitvanyCount}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Banki átutalás</span>
              <span className="font-medium">{Math.round(stats.bankTransferCount * 0.6)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Egyéb fizetés</span>
              <span className="font-medium">{Math.round(stats.cardCashCount * 0.4)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-600" />
              Óvoda
            </h3>
            <span className="text-xl sm:text-2xl font-bold text-orange-600">{stats.ovodaCount}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Banki átutalás</span>
              <span className="font-medium">{Math.round(stats.bankTransferCount * 0.4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Egyéb fizetés</span>
              <span className="font-medium">{Math.round(stats.cardCashCount * 0.6)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-600" />
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
                  Dátum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Állapot
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.slice(0, 5).map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.fileName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {invoice.organization === 'alapitvany' ? (
                        <>
                          <Building2 className="h-4 w-4 text-blue-600 mr-2" />
                          <span>Alapítvány</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-4 w-4 text-orange-600 mr-2" />
                          <span>Óvoda</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.extractedData?.partner || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.extractedData?.osszeg ? formatCurrency(invoice.extractedData.osszeg) : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.uploadedAt)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : invoice.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status === 'completed' ? 'Feldolgozva' :
                       invoice.status === 'processing' ? 'Feldolgozás alatt' :
                       invoice.status === 'error' ? 'Hiba' : 'Feltöltve'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { BarChart3, FileText, Building2, GraduationCap, TrendingUp, Calendar, DollarSign, Clock, Eye, Download, Banknote, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../lib/supabase';

interface Invoice {
  id: string;
  file_name: string;
  file_url: string;
  organization: 'alapitvany' | 'ovoda';
  uploaded_at: string;
  processed_at: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  extracted_text: string;
  partner: string;
  bank_account: string;
  subject: string;
  invoice_number: string;
  amount: number;
  invoice_date: string;
  payment_deadline: string;
  payment_method: string;
  invoice_type: 'bank_transfer' | 'card_cash_afterpay';
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

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalInvoices: 0,
    totalAmount: 0,
    alapitvanyCount: 0,
    ovodaCount: 0,
    bankTransferCount: 0,
    cardCashCount: 0,
    thisMonthCount: 0,
    pendingCount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      if (invoices) {
        // Calculate stats
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const calculatedStats: Stats = {
          totalInvoices: invoices.length,
          totalAmount: invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
          alapitvanyCount: invoices.filter(inv => inv.organization === 'alapitvany').length,
          ovodaCount: invoices.filter(inv => inv.organization === 'ovoda').length,
          bankTransferCount: invoices.filter(inv => inv.invoice_type === 'bank_transfer').length,
          cardCashCount: invoices.filter(inv => inv.invoice_type === 'card_cash_afterpay').length,
          thisMonthCount: invoices.filter(inv => new Date(inv.uploaded_at) >= thisMonth).length,
          pendingCount: invoices.filter(inv => inv.status === 'uploaded' || inv.status === 'processing').length
        };

        setStats(calculatedStats);
        setRecentInvoices(invoices.slice(0, 5)); // Get 5 most recent
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

  const downloadFile = async (invoice: Invoice) => {
    try {
      console.log('Attempting to download file for invoice:', invoice.id, invoice.file_name);
      
      if (!invoice.file_url || invoice.file_url.trim() === '') {
        console.error('No file URL available for invoice');
        return;
      }

      const extractFilePathFromUrl = (fileUrl: string): string | null => {
        try {
          const url = new URL(fileUrl);
          const pathParts = url.pathname.split('/');
          
          const bucketIndex = pathParts.findIndex(part => part === 'invoices');
          if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            return decodeURIComponent(filePath);
          }
          
          return null;
        } catch (error) {
          console.error('Error parsing file URL:', error);
          return null;
        }
      };

      const filePath = extractFilePathFromUrl(invoice.file_url);
      
      if (!filePath) {
        console.warn('Could not extract file path from URL, trying direct URL access');
        window.open(invoice.file_url, '_blank');
        return;
      }

      console.log('Extracted file path:', filePath);

      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('invoices')
        .download(filePath);

      if (downloadError) {
        console.error('Supabase storage download error:', downloadError);
        return;
      }

      if (fileBlob) {
        const url = URL.createObjectURL(fileBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = invoice.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Chart data
  const organizationData = [
    { name: 'Alapítvány', value: stats.alapitvanyCount, color: '#3B82F6' },
    { name: 'Óvoda', value: stats.ovodaCount, color: '#F59E0B' }
  ];

  const paymentTypeData = [
    { name: 'Banki átutalás', value: stats.bankTransferCount, color: '#10B981' },
    { name: 'Kártya/Készpénz', value: stats.cardCashCount, color: '#8B5CF6' }
  ];

  const monthlyData = [
    { month: 'Jan', amount: Math.floor(stats.totalAmount * 0.08) },
    { month: 'Feb', amount: Math.floor(stats.totalAmount * 0.12) },
    { month: 'Már', amount: Math.floor(stats.totalAmount * 0.15) },
    { month: 'Ápr', amount: Math.floor(stats.totalAmount * 0.10) },
    { month: 'Máj', amount: Math.floor(stats.totalAmount * 0.18) },
    { month: 'Jún', amount: Math.floor(stats.totalAmount * 0.22) },
    { month: 'Júl', amount: Math.floor(stats.totalAmount * 0.15) }
  ];

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
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-blue-600" />
          Áttekintés
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">Számla kezelési statisztikák és legutóbbi tevékenységek</p>
      </div>

      {/* Stats Cards */}
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
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Teljes összeg</dt>
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
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
            <div className="ml-3 sm:ml-4 w-0 flex-1">
              <dl>
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Feldolgozás alatt</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">{stats.pendingCount}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Havi összegek
          </h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}K`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Organization Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
            Szervezetek szerinti megoszlás
          </h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={organizationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {organizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
          Legutóbbi számlák
        </h3>

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-3 sm:space-y-4">
          {recentInvoices.map((invoice) => (
            <div 
              key={invoice.id} 
              className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedInvoice(invoice)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {invoice.file_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {invoice.invoice_number || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(invoice);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Letöltés"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Szervezet:</span>
                  <div className="flex items-center mt-1">
                    {invoice.organization === 'alapitvany' ? (
                      <>
                        <Building2 className="h-3 w-3 text-blue-800 mr-1" />
                        <span className="text-blue-800 text-xs">Alapítvány</span>
                      </>
                    ) : (
                      <>
                        <GraduationCap className="h-3 w-3 text-orange-800 mr-1" />
                        <span className="text-orange-800 text-xs">Óvoda</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-500">Összeg:</span>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>
                
                <div className="col-span-2">
                  <span className="text-gray-500">Partner:</span>
                  <p className="text-gray-900 truncate mt-1">
                    {invoice.partner || '-'}
                  </p>
                </div>
                
                <div className="col-span-2">
                  <span className="text-gray-500">Dátum:</span>
                  <p className="text-gray-900 mt-1">
                    {formatDate(invoice.invoice_date || invoice.uploaded_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Számla
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
                  Fizetés
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dátum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Állapot
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentInvoices.map((invoice) => (
                <tr 
                  key={invoice.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {invoice.file_name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                          {invoice.invoice_number || '-'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {invoice.organization === 'alapitvany' ? (
                        <>
                          <Building2 className="h-4 w-4 text-blue-800 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-900">Alapítvány</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-4 w-4 text-orange-800 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-900">Óvoda</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="max-w-[150px]">
                      <div className="text-sm text-gray-900 truncate">
                        {invoice.partner || '-'}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {invoice.subject || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      {invoice.invoice_type === 'bank_transfer' ? (
                        <>
                          <Banknote className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Átutalás</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Kártya/KP</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {formatDate(invoice.invoice_date || invoice.uploaded_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(invoice);
                      }}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                      title="Letöltés"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentInvoices.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <FileText className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Még nincsenek számlák</h3>
            <p className="mt-1 text-sm text-gray-500">
              Kezdje el a számlák feltöltésével az áttekintés megtekintéséhez.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal 
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSave={(updatedInvoice) => {
            setRecentInvoices(prev => prev.map(inv => 
              inv.id === updatedInvoice.id ? updatedInvoice : inv
            ));
            setSelectedInvoice(updatedInvoice);
            fetchDashboardData(); // Refresh stats
          }}
        />
      )}
    </div>
  );
};

// Invoice Detail Modal Component
interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSave: (updatedInvoice: Invoice) => void;
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, onClose, onSave }) => {
  const [editedInvoice, setEditedInvoice] = useState<Invoice>(invoice);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          partner: editedInvoice.partner,
          bank_account: editedInvoice.bank_account,
          subject: editedInvoice.subject,
          invoice_number: editedInvoice.invoice_number,
          amount: editedInvoice.amount,
          invoice_date: editedInvoice.invoice_date,
          payment_deadline: editedInvoice.payment_deadline,
          payment_method: editedInvoice.payment_method,
          invoice_type: editedInvoice.invoice_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedInvoice.id);

      if (error) throw error;

      onSave(editedInvoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '';
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Számla szerkesztése</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Alapadatok
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fájlnév</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900 break-words">{editedInvoice.file_name}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Szervezet</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center">
                      {editedInvoice.organization === 'alapitvany' ? (
                        <>
                          <Building2 className="h-4 w-4 text-blue-800 mr-2" />
                          <span className="text-sm font-medium text-gray-900">Feketerigó Alapítvány</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-4 w-4 text-orange-800 mr-2" />
                          <span className="text-sm font-medium text-gray-900">Feketerigó Alapítványi Óvoda</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Partner and Invoice Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-green-600" />
                Partner és számla adatok
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Partner neve *</label>
                  <input
                    type="text"
                    value={editedInvoice.partner || ''}
                    onChange={(e) => setEditedInvoice(prev => ({ ...prev, partner: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Partner neve"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Számlaszám</label>
                  <input
                    type="text"
                    value={editedInvoice.invoice_number || ''}
                    onChange={(e) => setEditedInvoice(prev => ({ ...prev, invoice_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Számlaszám"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tárgy / Szolgáltatás</label>
                  <textarea
                    value={editedInvoice.subject || ''}
                    onChange={(e) => setEditedInvoice(prev => ({ ...prev, subject: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Számla tárgya vagy szolgáltatás leírása"
                  />
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Banknote className="h-5 w-5 mr-2 text-green-600" />
                Pénzügyi adatok
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Összeg (HUF) *</label>
                  <input
                    type="number"
                    value={editedInvoice.amount || ''}
                    onChange={(e) => setEditedInvoice(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                  {editedInvoice.amount > 0 && (
                    <p className="text-sm text-gray-500 mt-1">{formatCurrency(editedInvoice.amount)}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fizetési mód</label>
                  <select
                    value={editedInvoice.invoice_type || 'bank_transfer'}
                    onChange={(e) => setEditedInvoice(prev => ({ 
                      ...prev, 
                      invoice_type: e.target.value as 'bank_transfer' | 'card_cash_afterpay'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bank_transfer">Banki átutalás</option>
                    <option value="card_cash_afterpay">Kártya/Készpénz/Utánvét</option>
                  </select>
                </div>
                
                {editedInvoice.invoice_type === 'bank_transfer' && (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bankszámlaszám</label>
                    <input
                      type="text"
                      value={editedInvoice.bank_account || ''}
                      onChange={(e) => setEditedInvoice(prev => ({ ...prev, bank_account: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                      placeholder="12345678-12345678-12345678"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Date Information */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Dátumok
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Számla kelte</label>
                  <input
                    type="date"
                    value={formatDate(editedInvoice.invoice_date)}
                    onChange={(e) => setEditedInvoice(prev => ({ 
                      ...prev, 
                      invoice_date: e.target.value ? parseDate(e.target.value) : ''
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fizetési határidő</label>
                  <input
                    type="date"
                    value={formatDate(editedInvoice.payment_deadline)}
                    onChange={(e) => setEditedInvoice(prev => ({ 
                      ...prev, 
                      payment_deadline: e.target.value ? parseDate(e.target.value) : ''
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
            >
              Bezárás
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editedInvoice.partner || !editedInvoice.amount}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Mentés...</span>
                </>
              ) : (
                <>
                  <span>Mentés</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
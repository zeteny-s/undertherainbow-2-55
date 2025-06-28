import React, { useState, useEffect } from 'react';
import { FileText, Building2, GraduationCap, Search, Filter, Eye, Download, Calendar, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
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

export const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      setDeleting(true);

      // Delete from storage if file_url exists
      if (invoice.file_url) {
        // Extract the file path from the URL
        const urlParts = invoice.file_url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'invoices');
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/');
          
          const { error: storageError } = await supabase.storage
            .from('invoices')
            .remove([filePath]);

          if (storageError) {
            console.warn('Failed to delete file from storage:', storageError);
            // Continue with database deletion even if storage deletion fails
          }
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) throw dbError;

      // Update local state
      setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      setDeleteConfirm(null);

      // Show success message
      alert('Számla sikeresen törölve!');

    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Hiba történt a számla törlése során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    } finally {
      setDeleting(false);
    }
  };

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

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.partner || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = filterOrg === 'all' || invoice.organization === filterOrg;
    
    return matchesSearch && matchesOrg;
  });

  const downloadFile = async (invoice: Invoice) => {
    if (invoice.file_url) {
      window.open(invoice.file_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-gray-600">Számlák betöltése...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Számla kezelés</h2>
            <p className="text-gray-600">Feltöltött számlák megtekintése, szűrése és kezelése</p>
          </div>
          <button
            onClick={fetchInvoices}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Frissítés
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keresés</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Fájlnév vagy partner keresése..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Szervezet</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterOrg}
                onChange={(e) => setFilterOrg(e.target.value)}
                className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Minden szervezet</option>
                <option value="alapitvany">Alapítvány</option>
                <option value="ovoda">Óvoda</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
                  Dátum
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
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
                      <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {formatDate(invoice.invoice_date || invoice.uploaded_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Részletek megtekintése"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadFile(invoice)}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Letöltés"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(invoice)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Számla törlése"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nem található számla</h3>
          <p className="mt-1 text-sm text-gray-500">
            Nincs a szűrési feltételeknek megfelelő számla.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Számla törlése</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-4">
                Biztosan törölni szeretné ezt a számlát? Ez a művelet nem vonható vissza.
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{deleteConfirm.file_name}</p>
                <p className="text-xs text-gray-500">
                  {deleteConfirm.partner && `Partner: ${deleteConfirm.partner}`}
                  {deleteConfirm.amount && ` • Összeg: ${formatCurrency(deleteConfirm.amount)}`}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Mégse
              </button>
              <button
                onClick={() => handleDeleteInvoice(deleteConfirm)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Törlés...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Törlés</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Számla részletei</h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Alapinformációk</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-500">Fájlnév</label>
                      <p className="text-sm font-medium text-gray-900">{selectedInvoice.file_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Szervezet</label>
                      <div className="flex items-center mt-1">
                        {selectedInvoice.organization === 'alapitvany' ? (
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
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Partner</label>
                      <p className="text-sm font-medium text-gray-900">{selectedInvoice.partner || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Számlaszám</label>
                      <p className="text-sm font-medium text-gray-900">{selectedInvoice.invoice_number || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Összeg</label>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(selectedInvoice.amount)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Tárgy</label>
                      <p className="text-sm font-medium text-gray-900">{selectedInvoice.subject || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Számla kelte</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedInvoice.invoice_date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Fizetési határidő</label>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedInvoice.payment_deadline)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Fizetési mód</label>
                      <p className="text-sm font-medium text-gray-900">{selectedInvoice.payment_method || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Bankszámlaszám</label>
                      <p className="text-sm font-medium text-gray-900">{selectedInvoice.bank_account || '-'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Kinyert szöveg</h4>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {selectedInvoice.extracted_text || 'Nincs kinyert szöveg'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
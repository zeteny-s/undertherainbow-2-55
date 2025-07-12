import React, { useState, useEffect } from 'react';
import { FileText, Building2, GraduationCap, Search, Filter, Eye, Download, Calendar, RefreshCw, Trash2, AlertTriangle, CheckCircle, X, Banknote, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Utility functions for status display
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

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const InvoiceList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

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

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
      addNotification('success', 'Számlák sikeresen betöltve');
    } catch (error) {
      console.error('Error fetching invoices:', error);
      addNotification('error', 'Hiba történt a számlák betöltése során');
    } finally {
      setLoading(false);
    }
  };

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

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      setDeleting(true);

      if (invoice.file_url) {
        const filePath = extractFilePathFromUrl(invoice.file_url);
        
        if (filePath) {
          console.log('Attempting to delete file from storage:', filePath);
          
          const { error: storageError } = await supabase.storage
            .from('invoices')
            .remove([filePath]);

          if (storageError) {
            console.warn('Failed to delete file from storage:', storageError);
            addNotification('info', 'Fájl törlése a tárolóból sikertelen, de az adatbázis rekord törölve lesz');
          } else {
            console.log('File successfully deleted from storage');
          }
        } else {
          console.warn('Could not extract file path from URL:', invoice.file_url);
          addNotification('info', 'Nem sikerült meghatározni a fájl elérési útját a tárolóban');
        }
      }

      const { error: dbError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) throw dbError;

      setInvoices(prev => prev.filter(inv => inv.id !== invoice.id));
      setDeleteConfirm(null);

      addNotification('success', 'Számla sikeresen törölve az adatbázisból és a tárolóból!');

    } catch (error) {
      console.error('Error deleting invoice:', error);
      addNotification('error', 'Hiba történt a számla törlése során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
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
    if (invoice.file_url && invoice.file_url.trim() !== '') {
      try {
        console.log('Attempting to download file:', invoice.file_url);
        
        // Try to fetch the file first to check if it exists
        const response = await fetch(invoice.file_url, { method: 'HEAD' });
        
        if (response.ok) {
          // File exists, open in new tab
          window.open(invoice.file_url, '_blank');
        } else {
          console.error('File not accessible:', response.status, response.statusText);
          addNotification('error', `Fájl nem érhető el: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error accessing file:', error);
        addNotification('error', 'Hiba történt a fájl elérésekor. Ellenőrizze a Supabase Storage beállításokat.');
      }
    } else {
      addNotification('error', 'Nincs elérhető fájl URL a számlához');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-gray-600">Számlák betöltése...</span>
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
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  {notification.type === 'info' && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Számla kezelés</h2>
            <p className="text-gray-600 text-sm sm:text-base">Feltöltött számlák megtekintése, szűrése és kezelése</p>
          </div>
          <button
            onClick={fetchInvoices}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Frissítés
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 gap-4">
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
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="border-b border-gray-200 p-3 sm:p-4 hover:bg-gray-50 transition-colors">
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
                    onClick={() => setSelectedInvoice(invoice)}
                    className="p-2 text-blue-600 hover:text-blue-900 transition-colors"
                    title="Részletek megtekintése"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => downloadFile(invoice)}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Letöltés"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(invoice)}
                    className="p-2 text-red-600 hover:text-red-900 transition-colors"
                    title="Számla törlése"
                  >
                    <Trash2 className="h-4 w-4" />
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
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
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
                Biztosan törölni szeretné ezt a számlát? Ez a művelet nem vonható vissza. A számla az adatbázisból és a fájltárolóból is törlődni fog.
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900 break-words">{deleteConfirm.file_name}</p>
                <p className="text-xs text-gray-500">
                  {deleteConfirm.partner && `Partner: ${deleteConfirm.partner}`}
                  {deleteConfirm.amount && ` • Összeg: ${formatCurrency(deleteConfirm.amount)}`}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden">
          <div className="bg-white rounded-xl max-w-6xl w-full h-[95vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Számla részletei</h3>
                  <button
                    onClick={() => downloadFile(selectedInvoice)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Letöltés
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => downloadFile(selectedInvoice)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Számla letöltése"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden min-h-0">
              <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Document Preview */}
                <div className="bg-gray-50 border-r border-gray-200 flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      Dokumentum előnézet ({selectedInvoice.file_name})
                    </h4>
                  </div>
                  <div className="flex-1 p-4 overflow-auto min-h-0">
                    {selectedInvoice.file_url && selectedInvoice.file_url.trim() !== '' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        {selectedInvoice.file_name.toLowerCase().endsWith('.pdf') ? (
                          <iframe
                            src={selectedInvoice.file_url}
                            className="w-full h-full min-h-[500px] border-0 rounded-lg shadow-sm bg-white"
                            title="PDF Preview"
                            onError={() => {
                              console.error('PDF preview failed to load:', selectedInvoice.file_url);
                            }}
                          />
                        ) : (
                          <img
                            src={selectedInvoice.file_url}
                            alt="Invoice preview"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-sm bg-white"
                            onError={(e) => {
                              console.error('Image preview failed to load:', selectedInvoice.file_url);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'text-center text-gray-500 p-8';
                              errorDiv.innerHTML = `
                                <div class="text-center">
                                  <svg class="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                  </svg>
                                  <p class="text-sm font-medium text-gray-900">Fájl nem található</p>
                                  <p class="text-xs text-gray-500 mt-1">A dokumentum nem érhető el vagy törölve lett</p>
                                  <p class="text-xs text-gray-400 mt-2 break-all">${selectedInvoice.file_url}</p>
                                </div>
                              `;
                              target.parentNode?.appendChild(errorDiv);
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <svg className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <p className="text-sm font-medium text-gray-900">Nincs elérhető előnézet</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedInvoice.file_url ? 'A fájl URL üres vagy érvénytelen' : 'Nincs fájl URL megadva'}
                          </p>
                          {selectedInvoice.file_url && (
                            <p className="text-xs text-gray-400 mt-2 break-all">{selectedInvoice.file_url}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Invoice Details */}
                <div className="bg-white flex flex-col h-full">
                  <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <h4 className="text-lg font-semibold text-gray-900">Számla részletes adatok</h4>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto min-h-0">
                    <div className="space-y-6">
                      {/* Basic Information Section */}
                      <div className="border-b border-gray-100 pb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Alapadatok</h5>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fájlnév</label>
                            <p className="text-sm font-medium text-gray-900 break-words">{selectedInvoice.file_name}</p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Szervezet</label>
                            <div className="flex items-center">
                              {selectedInvoice.organization === 'alapitvany' ? (
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
                          
                          <div className="bg-gray-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Állapot</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedInvoice.status)}`}>
                              {getStatusText(selectedInvoice.status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Partner and Invoice Information */}
                      <div className="border-b border-gray-100 pb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Partner és számla adatok</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Partner neve</label>
                            <p className="text-sm font-medium text-gray-900 break-words">{selectedInvoice.partner || 'Nincs megadva'}</p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Számlaszám</label>
                            <p className="text-sm font-medium text-gray-900 break-words">{selectedInvoice.invoice_number || 'Nincs megadva'}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="bg-gray-50 rounded-lg p-3 mt-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tárgy / Szolgáltatás</label>
                            <p className="text-sm font-medium text-gray-900 break-words">{selectedInvoice.subject || 'Nincs megadva'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Financial Information */}
                      <div className="border-b border-gray-100 pb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Pénzügyi adatok</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <label className="block text-xs font-medium text-green-700 mb-1">Összeg</label>
                            <p className="text-lg font-bold text-green-800">{formatCurrency(selectedInvoice.amount)}</p>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fizetési mód</label>
                            <div className="flex items-center">
                              {selectedInvoice.invoice_type === 'bank_transfer' ? (
                                <>
                                  <Banknote className="h-4 w-4 text-green-600 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">Banki átutalás</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4 text-purple-600 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">Kártya/Készpénz/Utánvét</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {selectedInvoice.bank_account && (
                          <div className="bg-gray-50 rounded-lg p-3 mt-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Bankszámlaszám</label>
                            <p className="text-sm font-medium text-gray-900 font-mono break-all">{selectedInvoice.bank_account}</p>
                          </div>
                        )}
                      </div>

                      {/* Date Information */}
                      <div className="border-b border-gray-100 pb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dátumok</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Számla kelte</label>
                              <p className="text-sm font-medium text-gray-900">{formatDate(selectedInvoice.invoice_date)}</p>
                            </div>
                          </div>
                          
                          {selectedInvoice.payment_deadline && (
                            <div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Fizetési határidő</label>
                                <p className="text-sm font-medium text-gray-900">{formatDate(selectedInvoice.payment_deadline)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* System Information */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Rendszer adatok</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Feltöltve</label>
                            <p className="text-sm font-medium text-gray-900">{formatDate(selectedInvoice.uploaded_at)}</p>
                          </div>
                          
                          {selectedInvoice.processed_at && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Feldolgozva</label>
                              <p className="text-sm font-medium text-gray-900">{formatDate(selectedInvoice.processed_at)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
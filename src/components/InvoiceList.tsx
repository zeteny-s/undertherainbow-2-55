import React, { useState, useEffect } from 'react';
import { FileText, Building2, GraduationCap, Search, Eye, Download, Calendar, RefreshCw, Trash2, AlertTriangle, CheckCircle, X, Banknote } from 'lucide-react';
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
  munkaszam?: string; // Work number field
  category?: string; // Invoice category classification
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
      
      // Clean up category values by removing " (AI)" suffix if present
      const cleanedData = (data || []).map(invoice => {
        if (invoice.category && typeof invoice.category === 'string' && invoice.category.endsWith(' (AI)')) {
          return {
            ...invoice,
            category: invoice.category.replace(' (AI)', '')
          };
        }
        return invoice;
      });
      
      setInvoices(cleanedData);
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
    try {
      console.log('Attempting to download file for invoice:', invoice.id, invoice.file_name);
      
      if (!invoice.file_url || invoice.file_url.trim() === '') {
        addNotification('error', 'Nincs elérhető fájl URL a számlához');
        return;
      }

      // Extract file path from URL for direct Supabase Storage access
      const filePath = extractFilePathFromUrl(invoice.file_url);
      
      if (!filePath) {
        console.warn('Could not extract file path from URL, trying direct URL access');
        // Fallback to direct URL access
        window.open(invoice.file_url, '_blank');
        return;
      }

      console.log('Extracted file path:', filePath);

      // Try to download directly from Supabase Storage
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from('invoices')
        .download(filePath);

      if (downloadError) {
        console.error('Supabase storage download error:', downloadError);
        addNotification('error', `Fájl letöltési hiba: ${downloadError.message}`);
        return;
      }

      if (fileBlob) {
        // Create download link
        const url = URL.createObjectURL(fileBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = invoice.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        addNotification('success', 'Fájl sikeresen letöltve!');
      } else {
        addNotification('error', 'Fájl nem található a tárolóban');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      addNotification('error', 'Hiba történt a fájl letöltése során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
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
                
                {invoice.munkaszam && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Munkaszám:</span>
                    <p className="text-gray-900 truncate mt-1 font-medium">
                      {invoice.munkaszam}
                    </p>
                  </div>
                )}
                
                {invoice.category && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Kategória:</span>
                    <p className="text-gray-900 truncate mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {invoice.category}
                      </span>
                    </p>
                  </div>
                )}
                
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
                      {invoice.munkaszam && (
                        <div className="text-xs text-blue-600 font-medium truncate mt-1">
                          Munkaszám: {invoice.munkaszam}
                        </div>
                      )}
                      {invoice.category && (
                        <div className="text-xs truncate mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {invoice.category}
                          </span>
                        </div>
                      )}
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
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Számla szerkesztése</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => downloadFile(selectedInvoice)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Letöltés
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <InvoiceEditForm 
              invoice={selectedInvoice}
              onSave={(updatedInvoice) => {
                setInvoices(prev => prev.map(inv => 
                  inv.id === updatedInvoice.id ? updatedInvoice : inv
                ));
                setSelectedInvoice(updatedInvoice);
              }}
              onCancel={() => setSelectedInvoice(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Separate component for invoice editing form
interface InvoiceEditFormProps {
  invoice: Invoice;
  onSave: (updatedInvoice: Invoice) => void;
  onCancel: () => void;
}

const InvoiceEditForm: React.FC<InvoiceEditFormProps> = ({ invoice, onSave, onCancel }) => {
  const [editedInvoice, setEditedInvoice] = useState<Invoice>(invoice);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean up category value by removing " (AI)" suffix if present
      let category = editedInvoice.category || 'Egyéb';
      if (category.endsWith(' (AI)')) {
        category = category.replace(' (AI)', '');
      }
      
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
          munkaszam: editedInvoice.munkaszam,
          category: category,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedInvoice.id);

      if (error) throw error;

      addNotification('success', 'Számla adatok sikeresen frissítve!');
      onSave(editedInvoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
      addNotification('error', 'Hiba történt a számla frissítése során');
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
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-3 w-80 max-w-[calc(100vw-2rem)]">
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Munkaszám</label>
                <input
                  type="text"
                  value={editedInvoice.munkaszam || ''}
                  onChange={(e) => setEditedInvoice(prev => ({ ...prev, munkaszam: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Munkaszám"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategória</label>
                <select
                  value={(editedInvoice.category && editedInvoice.category.endsWith(' (AI)')) 
                    ? editedInvoice.category.replace(' (AI)', '') 
                    : (editedInvoice.category || 'Egyéb')}
                  onChange={(e) => setEditedInvoice(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Bérleti díjak">Bérleti díjak</option>
                  <option value="Közüzemi díjak">Közüzemi díjak</option>
                  <option value="Szolgáltatások">Szolgáltatások</option>
                  <option value="Étkeztetés költségei">Étkeztetés költségei</option>
                  <option value="Személyi jellegű kifizetések">Személyi jellegű kifizetések</option>
                  <option value="Anyagköltség">Anyagköltség</option>
                  <option value="Tárgyi eszközök">Tárgyi eszközök</option>
                  <option value="Felújítás, beruházások">Felújítás, beruházások</option>
                  <option value="Egyéb">Egyéb</option>
                </select>
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
                <div className="space-y-3">
                  <select
                    value={editedInvoice.payment_method || (editedInvoice.invoice_type === 'bank_transfer' ? 'Banki átutalás' : '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditedInvoice(prev => ({ 
                        ...prev, 
                        invoice_type: value === 'Banki átutalás' ? 'bank_transfer' : 'card_cash_afterpay',
                        payment_method: value
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Banki átutalás">Banki átutalás</option>
                    <option value="Bankkártya">Bankkártya</option>
                    <option value="Készpénz">Készpénz</option>
                    <option value="Utánvét">Utánvét</option>
                    <option value="Online fizetés">Online fizetés</option>
                    <option value="Csoportos beszedés">Csoportos beszedés</option>
                  </select>
                  
                  {/* Note about payment types */}
                  <p className="text-xs text-gray-500 mt-1">
                    A fizetési mód automatikusan beállítja a számla típusát.
                  </p>
                </div>
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

      {/* Fixed Footer with Actions */}
      <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 font-medium"
          >
            Mégse
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
                <CheckCircle className="h-4 w-4" />
                <span>Mentés</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
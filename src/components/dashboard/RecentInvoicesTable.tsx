import React from 'react';
import { FileText, Building2, GraduationCap, Eye, Download, Calendar } from 'lucide-react';

interface Invoice {
  id: string;
  file_name: string;
  file_url: string;
  organization: 'alapitvany' | 'ovoda';
  uploaded_at: string;
  processed_at: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  partner: string;
  bank_account: string;
  subject: string;
  invoice_number: string;
  amount: number;
  invoice_date: string;
  payment_deadline: string;
  payment_method: string;
  invoice_type: 'bank_transfer' | 'card_cash_afterpay';
  munkaszam?: string;
  category?: string;
}

interface RecentInvoicesTableProps {
  invoices: Invoice[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  onViewInvoice: (invoice: Invoice) => void;
  onDownloadInvoice: (invoice: Invoice) => void;
}

export const RecentInvoicesTable: React.FC<RecentInvoicesTableProps> = ({
  invoices,
  formatCurrency,
  formatDate,
  onViewInvoice,
  onDownloadInvoice
}) => {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Legutóbbi számlák</h3>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden">
        {invoices.map((invoice) => (
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
                  onClick={() => onViewInvoice(invoice)}
                  className="p-2 text-blue-600 hover:text-blue-900 transition-colors"
                  title="Részletek megtekintése"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDownloadInvoice(invoice)}
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
                <span className="text-gray-500">Állapot:</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
                </div>
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
                Állapot
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
            {invoices.map((invoice) => (
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </span>
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
                      onClick={() => onViewInvoice(invoice)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Részletek megtekintése"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDownloadInvoice(invoice)}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                      title="Letöltés"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
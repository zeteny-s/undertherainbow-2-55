import React, { useState, useCallback } from 'react';
import { DollarSign, Upload, FileImage, CheckCircle2, Edit3, Save, X, Calendar } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useNotifications } from '../hooks/useNotifications';
import { convertFileToBase64 } from '../lib/documentAI';

interface PayrollRecord {
  id?: string;
  employeeName: string;
  projectCode: string | null;
  amount: number;
  date: string;
  isRental: boolean;
  organization: string;
}

interface PayrollSummary {
  id: string;
  year: number;
  month: number;
  organization: string;
  total_payroll: number;
  rental_costs: number;
  non_rental_costs: number;
  record_count: number;
  created_at: string;
}

export const PayrollCosts: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedRecords, setExtractedRecords] = useState<PayrollRecord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const { addNotification } = useNotifications();

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('error', 'Csak JPG, PNG és PDF fájlokat lehet feltölteni.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert file to base64 and process with Document AI first
      const base64Data = await convertFileToBase64(file);
      
      // Send directly to payroll-gemini with document processing
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          document: {
            content: base64Data,
            mimeType: file.type,
          },
        },
      });

      if (error) {
        throw new Error(`Document processing error: ${error.message}`);
      }

      if (!data?.document?.text) {
        throw new Error('No text extracted from document');
      }

      // Now send to payroll-gemini edge function
      const { data: payrollData, error: payrollError } = await supabase.functions.invoke('payroll-gemini', {
        body: {
          extractedText: data.document.text,
          organization: 'Alapítvány' // Default, can be dynamic based on user
        }
      });

      if (payrollError) {
        throw new Error(`Payroll processing error: ${payrollError.message}`);
      }

      if (payrollData?.success) {
        setExtractedRecords(payrollData.data);
        addNotification('success', 'Bérköltség adatok sikeresen kinyerve!');
      } else {
        throw new Error(payrollData?.error || 'Ismeretlen hiba történt');
      }
    } catch (error) {
      console.error('Error processing payroll file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt a feldolgozás során: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  }, [addNotification]);

  const updateRecord = (index: number, field: keyof PayrollRecord, value: any) => {
    const updated = [...extractedRecords];
    updated[index] = { ...updated[index], [field]: value };
    setExtractedRecords(updated);
  };

  const saveRecords = async () => {
    if (extractedRecords.length === 0) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nem vagy bejelentkezve');
      }

      // Save individual records
      const { error: recordsError } = await supabase
        .from('payroll_records')
        .insert(extractedRecords.map(record => ({
          employee_name: record.employeeName,
          project_code: record.projectCode,
          amount: record.amount,
          record_date: record.date,
          is_rental: record.isRental,
          organization: record.organization,
          uploaded_by: user.id
        })));

      if (recordsError) throw recordsError;

      // Update or create monthly summary
      const firstRecord = extractedRecords[0];
      const recordDate = new Date(firstRecord.date);
      const year = recordDate.getFullYear();
      const month = recordDate.getMonth() + 1;

      console.log('Creating summary for:', { year, month, organization: firstRecord.organization });

      const totalPayroll = extractedRecords.reduce((sum, r) => sum + r.amount, 0);
      const rentalCosts = extractedRecords.filter(r => r.isRental).reduce((sum, r) => sum + r.amount, 0);
      const nonRentalCosts = totalPayroll - rentalCosts;

      const { error: summaryError } = await supabase
        .from('payroll_summaries')
        .upsert({
          year,
          month,
          organization: firstRecord.organization,
          total_payroll: totalPayroll,
          rental_costs: rentalCosts,
          non_rental_costs: nonRentalCosts,
          record_count: extractedRecords.length,
          created_by: user.id
        }, {
          onConflict: 'year,month,organization'
        });

      if (summaryError) throw summaryError;

      addNotification('success', 'Bérköltség adatok sikeresen mentve!');
      setExtractedRecords([]);
      loadPayrollSummaries();
    } catch (error) {
      console.error('Error saving payroll records:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt a mentés során: ${errorMessage}`);
    }
  };

  const loadPayrollSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_summaries')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setPayrollSummaries(data || []);
    } catch (error) {
      console.error('Error loading payroll summaries:', error);
      addNotification('error', 'Hiba történt az összesítők betöltése során');
    }
  };

  React.useEffect(() => {
    loadPayrollSummaries();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatMonth = (year: number, month: number) => {
    return `${year}.${month.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-green-600" />
          Bérköltségek – Költségfeltöltés képfájlból
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Töltsd fel a havi bérköltségeket. A rendszer automatikusan felismeri az adatokat és hozzárendeli a munkaszámokat.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Upload className="h-5 w-5 mr-2 text-blue-600" />
          Fájl feltöltés
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <label htmlFor="payroll-upload" className="cursor-pointer">
              <span className="text-sm text-gray-600">
                Válassz fájlt a feltöltéshez (JPG, PNG, PDF)
              </span>
              <input
                id="payroll-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            <div>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                disabled={isUploading}
                onClick={() => document.getElementById('payroll-upload')?.click()}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Feldolgozás...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Feldolgozásra küldés
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Records Table */}
      {extractedRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
              Kinyert bérköltség adatok
            </h3>
            <button
              onClick={saveRecords}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Adatok mentése
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alkalmazott neve
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Munkaszám
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Összeg (HUF)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dátum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bérleti költség?
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {extractedRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={record.employeeName}
                          onChange={(e) => updateRecord(index, 'employeeName', e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{record.employeeName}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={record.projectCode || ''}
                          onChange={(e) => updateRecord(index, 'projectCode', e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{record.projectCode || '—'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingIndex === index ? (
                        <input
                          type="number"
                          value={record.amount}
                          onChange={(e) => updateRecord(index, 'amount', Number(e.target.value))}
                          className="w-full p-1 border rounded"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{formatCurrency(record.amount)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingIndex === index ? (
                        <input
                          type="date"
                          value={record.date}
                          onChange={(e) => updateRecord(index, 'date', e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{record.date}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingIndex === index ? (
                        <input
                          type="checkbox"
                          checked={record.isRental}
                          onChange={(e) => updateRecord(index, 'isRental', e.target.checked)}
                          className="w-4 h-4"
                        />
                      ) : (
                        <span className="text-sm">
                          {record.isRental ? '✅' : '❌'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingIndex === index ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Summaries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-600" />
            Havi bérköltség összesítők
          </h3>
        </div>

        <div className="overflow-x-auto">
          {payrollSummaries.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Még nincsenek mentett bérköltség adatok</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hónap
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Összes bérköltség
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bérleti költségek
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nem bérleti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rekordok száma
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollSummaries.map((summary) => (
                  <tr key={summary.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatMonth(summary.year, summary.month)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatCurrency(summary.total_payroll)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatCurrency(summary.rental_costs)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatCurrency(summary.non_rental_costs)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{summary.record_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
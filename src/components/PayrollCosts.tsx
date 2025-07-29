import React, { useState, useCallback } from 'react';
import { DollarSign, Upload, FileImage, CheckCircle2, Edit3, Save, X, Calendar, Trash2, AlertTriangle, Download } from 'lucide-react';
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
  tax_amount: number;
  created_at: string;
}

export const PayrollCosts: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedRecords, setExtractedRecords] = useState<PayrollRecord[]>([]);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<PayrollRecord | null>(null);
  const [deleteConfirmSummary, setDeleteConfirmSummary] = useState<PayrollSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const [viewingRecords, setViewingRecords] = useState<PayrollRecord[]>([]);
  const [viewingMonth, setViewingMonth] = useState<string>('');
  
  // New states for the workflow
  const [uploadedPayrollFile, setUploadedPayrollFile] = useState<File | null>(null);
  const [payrollFileUrl, setPayrollFileUrl] = useState<string>('');
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [isProcessingTax, setIsProcessingTax] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  
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
      // Store file and create preview URL
      setUploadedPayrollFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPayrollFileUrl(previewUrl);

      // Convert file to base64 and process with Document AI first
      const base64Data = await convertFileToBase64(file);
      
      // Send to process-document function first
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
        setStep('preview');
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

  const handleRendbenClick = () => {
    setShowTaxModal(true);
  };

  const handleTaxFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('error', 'Csak JPG, PNG és PDF fájlokat lehet feltölteni.');
      return;
    }

    setIsProcessingTax(true);
    
    try {
      // Convert file to base64 and process with Document AI first
      const base64Data = await convertFileToBase64(file);
      
      // Send to process-document function first
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

      // Now send to tax-gemini edge function
      const { data: taxData, error: taxError } = await supabase.functions.invoke('tax-gemini', {
        body: {
          extractedText: data.document.text,
          organization: 'Alapítvány'
        }
      });

      if (taxError) {
        throw new Error(`Tax processing error: ${taxError.message}`);
      }

      if (taxData?.success) {
        setTaxAmount(taxData.data.totalTaxAmount || 0);
        setShowTaxModal(false);
        setStep('confirm');
        addNotification('success', 'Adóadatok sikeresen kinyerve!');
      } else {
        throw new Error(taxData?.error || 'Ismeretlen hiba történt');
      }
    } catch (error) {
      console.error('Error processing tax file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt az adóadatok feldolgozása során: ${errorMessage}`);
    } finally {
      setIsProcessingTax(false);
    }
  }, [addNotification]);


  const saveRecords = async () => {
    if (extractedRecords.length === 0) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nem vagy bejelentkezve');
      }

      // Upload payroll file to storage
      let payrollFileUrl = '';
      if (uploadedPayrollFile) {
        const firstRecord = extractedRecords[0];
        const recordDate = new Date(firstRecord.date);
        const year = recordDate.getFullYear();
        const month = recordDate.getMonth() + 1;
        const fileName = `${year}-${month.toString().padStart(2, '0')}-payroll-${Date.now()}.${uploadedPayrollFile.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('payroll')
          .upload(fileName, uploadedPayrollFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('payroll')
          .getPublicUrl(fileName);
        payrollFileUrl = publicUrl;
      }

      // Upload tax file to storage (if exists from tax modal)
      let taxFileUrl = '';
      const taxFileInput = document.querySelector('#tax-file-input') as HTMLInputElement;
      if (taxFileInput?.files?.[0]) {
        const taxFile = taxFileInput.files[0];
        const firstRecord = extractedRecords[0];
        const recordDate = new Date(firstRecord.date);
        const year = recordDate.getFullYear();
        const month = recordDate.getMonth() + 1;
        const fileName = `${year}-${month.toString().padStart(2, '0')}-tax-${Date.now()}.${taxFile.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage
          .from('tax-documents')
          .upload(fileName, taxFile);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('tax-documents')
          .getPublicUrl(fileName);
        taxFileUrl = publicUrl;
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
          uploaded_by: user.id,
          file_name: uploadedPayrollFile?.name || null,
          file_url: payrollFileUrl || null
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
          total_payroll: totalPayroll + taxAmount,
          rental_costs: rentalCosts,
          non_rental_costs: nonRentalCosts,
          record_count: extractedRecords.length,
          tax_amount: taxAmount,
          created_by: user.id,
          payroll_file_url: payrollFileUrl || null,
          tax_file_url: taxFileUrl || null
        }, {
          onConflict: 'year,month,organization'
        });

      if (summaryError) throw summaryError;

      addNotification('success', 'Bérköltség adatok sikeresen mentve!');
      setExtractedRecords([]);
      await loadPayrollSummaries();
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
      
      // Ensure tax_amount exists in the data, default to 0 if missing
      const summariesWithTax = (data || []).map(summary => ({
        ...summary,
        tax_amount: (summary as any).tax_amount || 0
      }));
      
      setPayrollSummaries(summariesWithTax);
    } catch (error) {
      console.error('Error loading payroll summaries:', error);
      addNotification('error', 'Hiba történt az összesítők betöltése során');
    }
  };

  React.useEffect(() => {
    loadPayrollSummaries();
  }, []);

  const viewMonthlyRecords = async (year: number, month: number, organization: string) => {
    try {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('organization', organization)
        .gte('record_date', `${year}-${month.toString().padStart(2, '0')}-01`)
        .lt('record_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`)
        .order('record_date', { ascending: true });

      if (error) throw error;
      
      const records: PayrollRecord[] = (data || []).map(record => ({
        id: record.id,
        employeeName: record.employee_name,
        projectCode: record.project_code,
        amount: record.amount,
        date: record.record_date,
        isRental: record.is_rental,
        organization: record.organization
      }));
      
      setViewingRecords(records);
      setViewingMonth(`${year}.${month.toString().padStart(2, '0')}`);
    } catch (error) {
      console.error('Error loading monthly records:', error);
      addNotification('error', 'Hiba történt a havi rekordok betöltése során');
    }
  };

  const handleDeleteRecord = async (record: PayrollRecord) => {
    if (!record.id) return;
    
    try {
      setDeleting(true);
      
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', record.id);

      if (error) throw error;

      addNotification('success', 'Rekord sikeresen törölve');
      
      // Refresh the data
      loadPayrollSummaries();
      if (viewingRecords.length > 0) {
        const currentMonth = viewingMonth.split('.');
        const year = parseInt(currentMonth[0]);
        const month = parseInt(currentMonth[1]);
        const org = viewingRecords[0]?.organization || 'alapitvany';
        viewMonthlyRecords(year, month, org);
      }
      
      setDeleteConfirmRecord(null);
    } catch (error) {
      console.error('Error deleting record:', error);
      addNotification('error', 'Hiba történt a rekord törlése során');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteMonthlyPayroll = async (summary: PayrollSummary) => {
    try {
      setDeleting(true);
      
      // First delete all payroll records for this month/year/organization
      const { error: recordsError } = await supabase
        .from('payroll_records')
        .delete()
        .eq('organization', summary.organization)
        .gte('record_date', `${summary.year}-${summary.month.toString().padStart(2, '0')}-01`)
        .lt('record_date', `${summary.year}-${(summary.month + 1).toString().padStart(2, '0')}-01`);

      if (recordsError) throw recordsError;

      // Then delete the summary
      const { error: summaryError } = await supabase
        .from('payroll_summaries')
        .delete()
        .eq('year', summary.year)
        .eq('month', summary.month)
        .eq('organization', summary.organization);

      if (summaryError) throw summaryError;

      addNotification('success', 'Havi bérköltség összesítő és kapcsolódó rekordok sikeresen törölve');
      
      // Refresh the data
      loadPayrollSummaries();
      
      // Close detail modal if it was showing the deleted month
      if (viewingRecords.length > 0) {
        const currentMonth = viewingMonth.split('.');
        const currentYear = parseInt(currentMonth[0]);
        const currentMonthNum = parseInt(currentMonth[1]);
        
        if (currentYear === summary.year && currentMonthNum === summary.month) {
          setViewingRecords([]);
          setViewingMonth('');
        }
      }
      
      setDeleteConfirmSummary(null);
    } catch (error) {
      console.error('Error deleting monthly payroll:', error);
      addNotification('error', 'Hiba történt a havi bérköltség törlése során');
    } finally {
      setDeleting(false);
    }
  };

  const startEditingRecord = (record: PayrollRecord) => {
    setEditingRecordId(record.id!);
    setEditingRecord({ ...record });
  };

  const cancelEditingRecord = () => {
    setEditingRecordId(null);
    setEditingRecord(null);
  };

  const updateEditingRecord = (field: keyof PayrollRecord, value: any) => {
    if (editingRecord) {
      setEditingRecord({
        ...editingRecord,
        [field]: value
      });
    }
  };

  const saveEditedRecord = async () => {
    if (!editingRecord || !editingRecordId) return;
    
    try {
      const { error } = await supabase
        .from('payroll_records')
        .update({
          employee_name: editingRecord.employeeName,
          project_code: editingRecord.projectCode,
          amount: editingRecord.amount,
          record_date: editingRecord.date,
          is_rental: editingRecord.isRental,
          organization: editingRecord.organization
        })
        .eq('id', editingRecordId);

      if (error) throw error;

      addNotification('success', 'Rekord sikeresen frissítve');
      
      // Refresh the data
      loadPayrollSummaries();
      if (viewingRecords.length > 0) {
        const currentMonth = viewingMonth.split('.');
        const year = parseInt(currentMonth[0]);
        const month = parseInt(currentMonth[1]);
        const org = viewingRecords[0]?.organization || 'alapitvany';
        viewMonthlyRecords(year, month, org);
      }
      
      cancelEditingRecord();
    } catch (error) {
      console.error('Error updating record:', error);
      addNotification('error', 'Hiba történt a rekord frissítése során');
    }
  };

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

  const downloadMonthlyDocuments = async (summary: PayrollSummary) => {
    try {
      // Find the payroll summary with file URLs
      const { data: summaryWithFiles, error } = await supabase
        .from('payroll_summaries')
        .select('payroll_file_url, tax_file_url')
        .eq('id', summary.id)
        .single();

      if (error) throw error;

      const downloads = [];
      
      if (summaryWithFiles.payroll_file_url) {
        downloads.push({
          url: summaryWithFiles.payroll_file_url,
          filename: `${formatMonth(summary.year, summary.month)}-payroll.pdf`
        });
      }
      
      if (summaryWithFiles.tax_file_url) {
        downloads.push({
          url: summaryWithFiles.tax_file_url,
          filename: `${formatMonth(summary.year, summary.month)}-tax.pdf`
        });
      }

      if (downloads.length === 0) {
        addNotification('error', 'Nincsenek elérhető dokumentumok ehhez a hónaphoz');
        return;
      }

      // Download files
      for (const download of downloads) {
        const response = await fetch(download.url);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = download.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      addNotification('success', `${downloads.length} dokumentum letöltve`);
    } catch (error) {
      console.error('Error downloading documents:', error);
      addNotification('error', 'Hiba történt a dokumentumok letöltése során');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center">
          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-3 text-green-600" />
          Bérköltségek és Járulékok
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Töltsd fel a havi bérköltségeket. A rendszer automatikusan felismeri az adatokat és hozzárendeli a munkaszámokat.
        </p>
      </div>

      {/* Upload Section - Only show when no file is uploaded */}
      {step === 'upload' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-blue-600" />
            Bérköltség dokumentum feltöltése
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
      )}

      {/* Preview Section - Show document preview and extracted data side by side */}
      {step === 'preview' && uploadedPayrollFile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
            Bérköltség dokumentum előnézet és kinyert adatok
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Preview */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Dokumentum előnézet</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {uploadedPayrollFile.type === 'application/pdf' ? (
                  <div className="h-96 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">PDF dokumentum</p>
                      <p className="text-sm text-gray-500">{uploadedPayrollFile.name}</p>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={payrollFileUrl} 
                    alt="Bérköltség dokumentum" 
                    className="w-full h-96 object-contain bg-gray-50"
                  />
                )}
              </div>
            </div>

            {/* Extracted Data */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Kinyert bérköltség adatok</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Alkalmazott
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Összeg
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Munkaszám
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {extractedRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {record.employeeName}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {formatCurrency(record.amount)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {record.projectCode || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Rendben van button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleRendbenClick}
              className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 text-lg font-medium"
            >
              <CheckCircle2 className="h-5 w-5" />
              Rendben van
            </button>
          </div>
        </div>
      )}

      {/* Final confirmation section */}
      {step === 'confirm' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
            Végleges bérköltség adatok
          </h3>

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
                    Járulékok (HUF)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dátum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bérleti költség?
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {extractedRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.employeeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.projectCode || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(record.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency((record.amount * taxAmount) / extractedRecords.reduce((sum, r) => sum + r.amount, 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.isRental ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900" colSpan={2}>
                    Összesen:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(extractedRecords.reduce((sum, r) => sum + r.amount, 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {formatCurrency(taxAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    Teljes költség: {formatCurrency(extractedRecords.reduce((sum, r) => sum + r.amount, 0) + taxAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={() => {
                setStep('upload');
                setExtractedRecords([]);
                setUploadedPayrollFile(null);
                setPayrollFileUrl('');
                setTaxAmount(0);
              }}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Újra kezdés
            </button>
            <button
              onClick={saveRecords}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Adatok mentése
            </button>
          </div>
        </div>
      )}

      {/* Tax Document Upload Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Adó dokumentum feltöltése
            </h3>
            <p className="text-gray-600 mb-6">
              Kérjük, töltse fel az adó dokumentumot a járulékok kinyeréséhez.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <label htmlFor="tax-upload" className="cursor-pointer">
                <span className="text-sm text-gray-600">
                  Válassz adó dokumentumot (JPG, PNG, PDF)
                </span>
                <input
                  id="tax-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleTaxFileUpload}
                  disabled={isProcessingTax}
                  className="hidden"
                />
              </label>
              <div className="mt-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                  disabled={isProcessingTax}
                  onClick={() => document.getElementById('tax-file-input')?.click()}
                >
                  {isProcessingTax ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Feldolgozás...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Feltöltés
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowTaxModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Mégse
              </button>
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ebből Járulékok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{formatCurrency(summary.tax_amount)}</span>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex gap-2">
                         <button
                           onClick={() => viewMonthlyRecords(summary.year, summary.month, summary.organization)}
                           className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                           title="Részletek megtekintése"
                         >
                           <CheckCircle2 className="h-4 w-4" />
                           Részletek
                         </button>
                          <button
                            onClick={() => downloadMonthlyDocuments(summary)}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                            title="Dokumentumok letöltése"
                          >
                            <Download className="h-4 w-4" />
                            Letöltés
                          </button>
                          <button
                            onClick={() => setDeleteConfirmSummary(summary)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                            title="Teljes havi összesítő törlése"
                          >
                            <Trash2 className="h-4 w-4" />
                            Törlés
                          </button>
                       </div>
                     </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Monthly Records Detail Modal */}
      {viewingRecords.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bérköltség részletek - {viewingMonth}
                </h3>
                <button
                  onClick={() => {
                    setViewingRecords([]);
                    setViewingMonth('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
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
                      Ebből Járulékok (HUF)
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
                  {viewingRecords.map((record) => {
                    // Find the summary for this month to get tax_amount
                    const currentSummary = payrollSummaries.find(s => 
                      s.year === parseInt(viewingMonth.split('.')[0]) && 
                      s.month === parseInt(viewingMonth.split('.')[1])
                    );
                    const monthlyTaxAmount = currentSummary?.tax_amount || 0;
                    const totalPayrollForMonth = viewingRecords.reduce((sum, r) => sum + r.amount, 0);
                    const employeeTaxShare = totalPayrollForMonth > 0 ? (record.amount * monthlyTaxAmount) / totalPayrollForMonth : 0;

                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRecordId === record.id ? (
                            <input
                              type="text"
                              value={editingRecord?.employeeName || ''}
                              onChange={(e) => updateEditingRecord('employeeName', e.target.value)}
                              className="w-full p-1 border rounded"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{record.employeeName}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRecordId === record.id ? (
                            <input
                              type="text"
                              value={editingRecord?.projectCode || ''}
                              onChange={(e) => updateEditingRecord('projectCode', e.target.value)}
                              className="w-full p-1 border rounded"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{record.projectCode || '—'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRecordId === record.id ? (
                            <input
                              type="number"
                              value={editingRecord?.amount || 0}
                              onChange={(e) => updateEditingRecord('amount', Number(e.target.value))}
                              className="w-full p-1 border rounded"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{formatCurrency(record.amount)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{formatCurrency(employeeTaxShare)}</span>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {editingRecordId === record.id ? (
                             <input
                               type="date"
                               value={editingRecord?.date || ''}
                               onChange={(e) => updateEditingRecord('date', e.target.value)}
                               className="w-full p-1 border rounded"
                             />
                           ) : (
                             <span className="text-sm text-gray-900">{record.date}</span>
                           )}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {editingRecordId === record.id ? (
                             <input
                               type="checkbox"
                               checked={editingRecord?.isRental || false}
                               onChange={(e) => updateEditingRecord('isRental', e.target.checked)}
                               className="w-4 h-4"
                             />
                           ) : (
                             <span className="text-sm">
                               {record.isRental ? '✅' : '❌'}
                             </span>
                           )}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {editingRecordId === record.id ? (
                             <div className="flex gap-2">
                               <button
                                 onClick={saveEditedRecord}
                                 className="text-green-600 hover:text-green-800"
                                 title="Mentés"
                               >
                                 <Save className="h-4 w-4" />
                               </button>
                               <button
                                 onClick={cancelEditingRecord}
                                 className="text-gray-600 hover:text-gray-800"
                                 title="Mégse"
                               >
                                 <X className="h-4 w-4" />
                               </button>
                             </div>
                           ) : (
                             <div className="flex gap-2">
                               <button
                                 onClick={() => startEditingRecord(record)}
                                 className="text-blue-600 hover:text-blue-800"
                                 title="Szerkesztés"
                               >
                                 <Edit3 className="h-4 w-4" />
                               </button>
                               <button
                                 onClick={() => setDeleteConfirmRecord(record)}
                                 className="text-red-600 hover:text-red-800"
                                 title="Törlés"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </button>
                             </div>
                           )}
                         </td>
                        </tr>
                      );
                    })}
                   </tbody>
                   <tfoot className="bg-gray-50">
                     <tr>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900" colSpan={2}>
                         Összesen:
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                         {formatCurrency(viewingRecords.reduce((sum, r) => sum + r.amount, 0))}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                         {(() => {
                           const currentSummary = payrollSummaries.find(s => 
                             s.year === parseInt(viewingMonth.split('.')[0]) && 
                             s.month === parseInt(viewingMonth.split('.')[1])
                           );
                           return formatCurrency(currentSummary?.tax_amount || 0);
                         })()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                         {(() => {
                           const currentSummary = payrollSummaries.find(s => 
                             s.year === parseInt(viewingMonth.split('.')[0]) && 
                             s.month === parseInt(viewingMonth.split('.')[1])
                           );
                           const rentalCosts = viewingRecords.filter(r => r.isRental).reduce((sum, r) => sum + r.amount, 0);
                           const nonRentalCosts = viewingRecords.reduce((sum, r) => sum + r.amount, 0) - rentalCosts;
                           return `Bérleti: ${formatCurrency(rentalCosts)} | Nem bérleti: ${formatCurrency(nonRentalCosts)}`;
                         })()}
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                         {viewingRecords.length} db
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap"></td>
                     </tr>
                   </tfoot>
                 </table>
               </div>
             </div>
           </div>
           </div>
         )}

        {/* Delete Record Confirmation Modal */}
        {deleteConfirmRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Bérköltség rekord törlése</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  Biztosan törölni szeretné ezt a bérköltség rekordot? Ez a művelet nem vonható vissza.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">{deleteConfirmRecord.employeeName}</p>
                  <p className="text-xs text-gray-500">
                    {deleteConfirmRecord.projectCode && `Munkaszám: ${deleteConfirmRecord.projectCode}`}
                    {` • Összeg: ${formatCurrency(deleteConfirmRecord.amount)}`}
                    {` • Dátum: ${deleteConfirmRecord.date}`}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setDeleteConfirmRecord(null)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Mégse
                </button>
                <button
                  onClick={() => handleDeleteRecord(deleteConfirmRecord)}
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

        {/* Delete Monthly Summary Confirmation Modal */}
        {deleteConfirmSummary && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Havi bérköltség összesítő törlése</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-4">
                  Biztosan törölni szeretné a teljes havi bérköltség összesítőt? Ez törölni fogja az összes kapcsolódó bérköltség rekordot és a havi összesítőt is. Ez a művelet nem vonható vissza.
                </p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-900">
                    {formatMonth(deleteConfirmSummary.year, deleteConfirmSummary.month)} - {deleteConfirmSummary.organization === 'alapitvany' ? 'Feketerigó Alapítvány' : 'Feketerigó Alapítványi Óvoda'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {`Rekordok száma: ${deleteConfirmSummary.record_count} db`}
                    {` • Összeg: ${formatCurrency(deleteConfirmSummary.total_payroll)}`}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setDeleteConfirmSummary(null)}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Mégse
                </button>
                <button
                  onClick={() => handleDeleteMonthlyPayroll(deleteConfirmSummary)}
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
      </div>
    );
  };

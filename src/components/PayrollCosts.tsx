import React, { useState } from 'react';
import { DollarSign, Upload, FileImage, CheckCircle2, Edit3, Save, X, Calendar, Trash2, AlertTriangle } from 'lucide-react';
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
  tax_amount: number;
  record_count: number;
  created_at: string;
  payroll_file_url?: string | null;
  tax_file_url?: string | null;
}

export const PayrollCosts: React.FC = () => {
  const [extractedRecords, setExtractedRecords] = useState<PayrollRecord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<PayrollRecord | null>(null);
  const [deleteConfirmSummary, setDeleteConfirmSummary] = useState<PayrollSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const [viewingRecords, setViewingRecords] = useState<PayrollRecord[]>([]);
  const [viewingMonth, setViewingMonth] = useState<string>('');
  
  // Step-by-step workflow state
  const [currentStep, setCurrentStep] = useState<'payroll' | 'tax' | 'complete'>('payroll');
  const [payrollFile, setPayrollFile] = useState<File | null>(null);
  const [taxFile, setTaxFile] = useState<File | null>(null);
  const [payrollPreview, setPayrollPreview] = useState<string>('');
  const [taxPreview, setTaxPreview] = useState<string>('');
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [isProcessingTax, setIsProcessingTax] = useState(false);
  const [extractedTaxAmount, setExtractedTaxAmount] = useState<number>(0);
  const [currentPayrollFileUrl, setCurrentPayrollFileUrl] = useState<string>('');
  const [currentTaxFileUrl, setCurrentTaxFileUrl] = useState<string>('');
  
  const { addNotification } = useNotifications();

  const createFilePreview = (file: File): string => {
    // Always create object URL for both images and PDFs
    return URL.createObjectURL(file);
  };

  const handlePayrollFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('error', 'Csak JPG, PNG és PDF fájlokat lehet feltölteni.');
      return;
    }

    // Clean up previous object URL
    if (payrollPreview) {
      URL.revokeObjectURL(payrollPreview);
    }
    
    setPayrollFile(file);
    setPayrollPreview(createFilePreview(file));

    // Auto-process payroll file immediately
    await processPayrollFile(file);
  };

  const handleTaxFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('error', 'Csak JPG, PNG és PDF fájlokat lehet feltölteni.');
      return;
    }

    // Clean up previous object URL
    if (taxPreview) {
      URL.revokeObjectURL(taxPreview);
    }
    
    setTaxFile(file);
    setTaxPreview(createFilePreview(file));

    // Auto-process tax file immediately
    await processTaxFile(file);
  };

  const processPayrollFile = async (file: File) => {
    console.log('🚀 Processing payroll file:', file.name);
    setIsProcessingPayroll(true);
    
    try {
      // Get user for file upload
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      
      // Upload payroll file to storage
      console.log('📤 Uploading payroll file to storage');
      const payrollFileName = `${userId}/${Date.now()}_${file.name}`;
      const { data: payrollUpload, error: payrollUploadError } = await supabase.storage
        .from('payroll')
        .upload(payrollFileName, file);

      if (payrollUploadError) {
        throw new Error('Payroll file upload failed: ' + payrollUploadError.message);
      }

      setCurrentPayrollFileUrl(payrollUpload.path);

      // Convert to base64 for OCR
      console.log('🔍 Converting payroll file to base64 for OCR');
      const payrollBase64 = await convertFileToBase64(file);
      
      // Step 1: OCR with process-document
      console.log('🤖 Calling process-document function for payroll');
      const { data: docData, error: docError } = await supabase.functions.invoke('process-document', {
        body: {
          document: {
            content: payrollBase64,
            mimeType: file.type,
          },
        },
      });

      if (docError) {
        throw new Error(`Document processing error: ${docError.message}`);
      }

      if (!docData?.document?.text) {
        throw new Error('No text extracted from payroll document');
      }

      // Step 2: Process with payroll-gemini
      console.log('🧠 Calling payroll-gemini function');
      const { data: payrollData, error: payrollError } = await supabase.functions.invoke('payroll-gemini', {
        body: {
          extractedText: docData.document.text,
          organization: 'Alapítvány'
        }
      });

      if (payrollError) {
        throw new Error(`Payroll processing error: ${payrollError.message}`);
      }

      if (!payrollData?.success) {
        throw new Error(payrollData?.error || 'Failed to process payroll data');
      }

      setExtractedRecords(payrollData.data);
      setCurrentStep('tax');
      addNotification('success', 'Bérköltség dokumentum sikeresen feldolgozva! Most töltse fel a járulék dokumentumot.');
      
    } catch (error) {
      console.error('💥 Error processing payroll file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt a bérköltség feldolgozása során: ${errorMessage}`);
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const processTaxFile = async (file: File) => {
    console.log('🚀 Processing tax file:', file.name);
    setIsProcessingTax(true);
    
    try {
      // Get user for file upload
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;
      
      // Upload tax file to storage
      console.log('📤 Uploading tax file to storage');
      const taxFileName = `${userId}/${Date.now()}_${file.name}`;
      const { data: taxUpload, error: taxUploadError } = await supabase.storage
        .from('tax-documents')
        .upload(taxFileName, file);

      if (taxUploadError) {
        throw new Error('Tax file upload failed: ' + taxUploadError.message);
      }

      setCurrentTaxFileUrl(taxUpload.path);

      // Convert to base64 for OCR
      console.log('🔍 Converting tax file to base64 for OCR');
      const taxBase64 = await convertFileToBase64(file);
      
      // Step 1: OCR with process-document
      console.log('🤖 Calling process-document function for tax');
      const { data: taxDocData, error: taxDocError } = await supabase.functions.invoke('process-document', {
        body: {
          document: {
            content: taxBase64,
            mimeType: file.type,
          },
        },
      });

      if (taxDocError) {
        throw new Error(`Tax document processing error: ${taxDocError.message}`);
      }

      if (!taxDocData?.document?.text) {
        throw new Error('No text extracted from tax document');
      }

      // Step 2: Process with tax-gemini
      console.log('🧠 Calling tax-gemini function');
      const { data: taxData, error: taxError } = await supabase.functions.invoke('tax-gemini', {
        body: {
          extractedText: taxDocData.document.text,
          organization: 'Alapítvány'
        }
      });

      if (taxError) {
        throw new Error(`Tax processing error: ${taxError.message}`);
      }

      if (taxData?.success) {
        const taxAmount = taxData.data.totalTaxAmount;
        setExtractedTaxAmount(taxAmount);
        setCurrentStep('complete');
        addNotification('success', `Járulék dokumentum sikeresen feldolgozva! Összeg: ${formatCurrency(taxAmount)}`);
      } else {
        throw new Error(taxData?.error || 'Failed to process tax data');
      }
      
    } catch (error) {
      console.error('💥 Error processing tax file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt a járulék feldolgozása során: ${errorMessage}`);
    } finally {
      setIsProcessingTax(false);
    }
  };

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
          tax_amount: extractedTaxAmount,
          record_count: extractedRecords.length,
          created_by: user.id,
          payroll_file_url: currentPayrollFileUrl,
          tax_file_url: currentTaxFileUrl || null
        }, {
          onConflict: 'year,month,organization'
        });

      if (summaryError) throw summaryError;

      addNotification('success', 'Bérköltség adatok sikeresen mentve!');
      // Clear form
      setExtractedRecords([]);
      setExtractedTaxAmount(0);
      setCurrentPayrollFileUrl('');
      setCurrentTaxFileUrl('');
      setPayrollFile(null);
      setTaxFile(null);
      // Clean up object URLs to prevent memory leaks
      if (payrollPreview) {
        URL.revokeObjectURL(payrollPreview);
        setPayrollPreview('');
      }
      if (taxPreview) {
        URL.revokeObjectURL(taxPreview);
        setTaxPreview('');
      }
      setCurrentStep('payroll');
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
      setPayrollSummaries(data || []);
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

  const downloadFiles = async (summary: PayrollSummary) => {
    try {
      const downloads = [];
      
      // Download payroll file if exists
      if (summary.payroll_file_url) {
        const { data: payrollData, error: payrollError } = await supabase.storage
          .from('payroll')
          .download(summary.payroll_file_url);
          
        if (!payrollError && payrollData) {
          const url = URL.createObjectURL(payrollData);
          const link = document.createElement('a');
          link.href = url;
          link.download = `berek_${summary.year}_${summary.month.toString().padStart(2, '0')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          downloads.push('bérek');
        }
      }
      
      // Download tax file if exists
      if (summary.tax_file_url) {
        const { data: taxData, error: taxError } = await supabase.storage
          .from('tax-documents')
          .download(summary.tax_file_url);
          
        if (!taxError && taxData) {
          const url = URL.createObjectURL(taxData);
          const link = document.createElement('a');
          link.href = url;
          link.download = `jarulekok_${summary.year}_${summary.month.toString().padStart(2, '0')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          downloads.push('járulékok');
        }
      }
      
      if (downloads.length > 0) {
        addNotification('success', `Fájlok letöltve: ${downloads.join(', ')}`);
      } else {
        addNotification('info', 'Nincs elérhető fájl a letöltéshez');
      }
    } catch (error) {
      console.error('Download error:', error);
      addNotification('error', 'Hiba történt a letöltés során');
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
          Töltsd fel a havi bérköltségeket és járulékokat lépésről lépésre. A rendszer automatikusan felismeri az adatokat.
        </p>
      </div>

      {/* Step-by-Step Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {/* Step 1 - Payroll */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'payroll' ? 'bg-blue-600 text-white' : 
                (currentStep === 'tax' || currentStep === 'complete') ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === 'payroll' ? 'text-blue-600' : 
                (currentStep === 'tax' || currentStep === 'complete') ? 'text-green-600' : 'text-gray-500'
              }`}>
                Bérek feltöltése
              </span>
            </div>
            
            {/* Arrow */}
            <div className="w-8 h-px bg-gray-300"></div>
            
            {/* Step 2 - Tax */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'tax' ? 'bg-blue-600 text-white' : 
                currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === 'tax' ? 'text-blue-600' : 
                currentStep === 'complete' ? 'text-green-600' : 'text-gray-500'
              }`}>
                Járulékok feltöltése
              </span>
            </div>
            
            {/* Arrow */}
            <div className="w-8 h-px bg-gray-300"></div>
            
            {/* Step 3 - Complete */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === 'complete' ? 'text-green-600' : 'text-gray-500'
              }`}>
                Kész
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Payroll Upload */}
        {currentStep === 'payroll' && (
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Bérköltség dokumentum feltöltése
            </h3>
            <p className="text-gray-600 mb-8">
              Töltse fel a havi bérköltség dokumentumot. A rendszer automatikusan feldolgozza és kinyeri az adatokat.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-blue-400 transition-colors bg-gray-50">
              <div className="mx-auto max-w-sm">
                <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Bérköltség dokumentum</h4>
                  <p className="text-sm text-gray-600">JPG, PNG vagy PDF fájl</p>
                  
                  {!payrollFile ? (
                    <div>
                      <label htmlFor="payroll-upload" className="cursor-pointer">
                        <input
                          id="payroll-upload"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handlePayrollFileUpload}
                          disabled={isProcessingPayroll}
                          className="hidden"
                        />
                        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2 font-medium">
                          <Upload className="h-5 w-5" />
                          Fájl kiválasztása
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isProcessingPayroll ? (
                        <div className="flex items-center justify-center space-x-2 text-blue-600">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-medium">Feldolgozás folyamatban...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Sikeres feldolgozás!</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">{payrollFile.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payroll Preview */}
            {payrollPreview && (
              <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
                <h5 className="text-lg font-medium text-gray-900 mb-4">Dokumentum előnézet</h5>
                <div className="w-full h-96 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {payrollFile?.type.startsWith('image/') ? (
                    <img 
                      src={payrollPreview} 
                      alt="Payroll preview" 
                      className="w-full h-full object-contain" 
                    />
                  ) : payrollFile?.type === 'application/pdf' ? (
                    <iframe
                      src={payrollPreview}
                      className="w-full h-full border-0"
                      title="Payroll PDF Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>{payrollFile?.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Tax Upload */}
        {currentStep === 'tax' && (
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Járulék dokumentum feltöltése
            </h3>
            <p className="text-gray-600 mb-8">
              Töltse fel a járulék dokumentumot. A rendszer automatikusan feldolgozza és kinyeri a járulék összeget.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 hover:border-purple-400 transition-colors bg-gray-50">
              <div className="mx-auto max-w-sm">
                <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Járulék dokumentum</h4>
                  <p className="text-sm text-gray-600">JPG, PNG vagy PDF fájl</p>
                  
                  {!taxFile ? (
                    <div>
                      <label htmlFor="tax-upload" className="cursor-pointer">
                        <input
                          id="tax-upload"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleTaxFileUpload}
                          disabled={isProcessingTax}
                          className="hidden"
                        />
                        <div className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 inline-flex items-center gap-2 font-medium">
                          <Upload className="h-5 w-5" />
                          Fájl kiválasztása
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isProcessingTax ? (
                        <div className="flex items-center justify-center space-x-2 text-purple-600">
                          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-medium">Feldolgozás folyamatban...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2 text-green-600">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Sikeres feldolgozás!</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">{taxFile.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tax Preview */}
            {taxPreview && (
              <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
                <h5 className="text-lg font-medium text-gray-900 mb-4">Dokumentum előnézet</h5>
                <div className="w-full h-96 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  {taxFile?.type.startsWith('image/') ? (
                    <img 
                      src={taxPreview} 
                      alt="Tax preview" 
                      className="w-full h-full object-contain" 
                    />
                  ) : taxFile?.type === 'application/pdf' ? (
                    <iframe
                      src={taxPreview}
                      className="w-full h-full border-0"
                      title="Tax PDF Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>{taxFile?.name}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Option to skip tax document */}
            <div className="mt-8">
              <button
                onClick={() => setCurrentStep('complete')}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium underline"
              >
                Átugrás (csak bérköltségek mentése)
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 'complete' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Feldolgozás befejezve!
              </h3>
              <p className="text-gray-600">
                {taxFile ? 'Mindkét dokumentum sikeresen feldolgozva.' : 'Bérköltség dokumentum sikeresen feldolgozva.'} Most mentheti az adatokat.
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setCurrentStep('payroll');
                  setPayrollFile(null);
                  setTaxFile(null);
                  setExtractedRecords([]);
                  setExtractedTaxAmount(0);
                  if (payrollPreview) URL.revokeObjectURL(payrollPreview);
                  if (taxPreview) URL.revokeObjectURL(taxPreview);
                  setPayrollPreview('');
                  setTaxPreview('');
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Új feltöltés
              </button>
              <button
                onClick={saveRecords}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
              >
                <Save className="h-5 w-5" />
                Adatok mentése
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Section - Only show when we have extracted records */}
      {extractedRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
              Kinyert bérköltség adatok
              {extractedTaxAmount > 0 && (
                <span className="ml-3 text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                  Járulék: {formatCurrency(extractedTaxAmount)}
                </span>
              )}
            </h3>
            {currentStep === 'complete' && (
              <button
                onClick={saveRecords}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Adatok mentése
              </button>
            )}
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
                    Járulékok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teljes költség
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rekordok száma
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
                      <span className="text-sm text-gray-900">{formatCurrency(summary.tax_amount || 0)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(summary.total_payroll + (summary.tax_amount || 0))}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{summary.record_count}</span>
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
                           onClick={() => downloadFiles(summary)}
                           className="text-green-600 hover:text-green-800 flex items-center gap-1"
                           title="Dokumentumok letöltése"
                         >
                           <Upload className="h-4 w-4" />
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
                    {viewingRecords.map((record) => (
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
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEditingRecord}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditingRecord(record)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmRecord(record)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
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
                  <h3 className="text-lg font-medium text-gray-900">Rekord törlése</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Biztosan törölni szeretné ezt a bérköltség rekordot?
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{deleteConfirmRecord.employeeName}</p>
                  <p className="text-sm text-gray-600">{formatCurrency(deleteConfirmRecord.amount)} - {deleteConfirmRecord.date}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmRecord(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={deleting}
                >
                  Mégse
                </button>
                <button
                  onClick={() => handleDeleteRecord(deleteConfirmRecord)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={deleting}
                >
                  {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Törlés
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
                <p className="text-sm text-gray-500">
                  Biztosan törölni szeretné ezt a havi bérköltség összesítőt és az összes kapcsolódó rekordot?
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {formatMonth(deleteConfirmSummary.year, deleteConfirmSummary.month)} - {deleteConfirmSummary.organization}
                  </p>
                  <p className="text-sm text-gray-600">
                    {deleteConfirmSummary.record_count} rekord - {formatCurrency(deleteConfirmSummary.total_payroll)}
                  </p>
                </div>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Ez a művelet nem vonható vissza!
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmSummary(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={deleting}
                >
                  Mégse
                </button>
                <button
                  onClick={() => handleDeleteMonthlyPayroll(deleteConfirmSummary)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={deleting}
                >
                  {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  Összes törlése
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
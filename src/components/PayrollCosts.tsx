import React, { useState, useCallback } from 'react';
import { DollarSign, Upload, FileImage, CheckCircle2, Edit3, Save, X, Calendar, Trash2, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useNotifications } from '../hooks/useNotifications';
import { convertFileToBase64 } from '../lib/documentAI';
import { formatCurrency } from '../utils/formatters';
interface PayrollRecord {
  id?: string;
  employeeName: string;
  projectCode: string | null;
  amount: number;
  date: string;
  isRental: boolean;
  isCash?: boolean;
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
  cash_costs: number;
  bank_transfer_costs: number;
  record_count: number;
  tax_amount: number;
  created_at: string;
  payroll_file_url?: string;
  cash_file_url?: string;
  tax_file_url?: string;
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
  const [uploadedCashFile, setUploadedCashFile] = useState<File | null>(null);
  const [uploadedTaxFile, setUploadedTaxFile] = useState<File | null>(null);
  const [payrollFileUrl, setPayrollFileUrl] = useState<string>('');
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashRecords, setCashRecords] = useState<PayrollRecord[]>([]);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [isProcessingTax, setIsProcessingTax] = useState(false);
  const [isProcessingCash, setIsProcessingCash] = useState(false);
  const [step, setStep] = useState<'organization' | 'upload' | 'preview' | 'cash-question' | 'cash-preview' | 'confirm'>('organization');
  const [currentMonthYear, setCurrentMonthYear] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const {
    addNotification
  } = useNotifications();
  const uploadFileToStorage = async (file: File, bucketName: string, monthYear: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${monthYear}/${fileName}`;
    const {
      data,
      error
    } = await supabase.storage.from(bucketName).upload(filePath, file);
    if (error) throw error;
    return data.path;
  };
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
      const {
        data,
        error
      } = await supabase.functions.invoke('process-document', {
        body: {
          document: {
            content: base64Data,
            mimeType: file.type
          }
        }
      });
      if (error) {
        throw new Error(`Document processing error: ${error.message}`);
      }
      if (!data?.document?.text) {
        throw new Error('No text extracted from document');
      }

      // Now send to payroll-gemini edge function
      const {
        data: payrollData,
        error: payrollError
      } = await supabase.functions.invoke('payroll-gemini', {
        body: {
          extractedText: data.document.text,
          organization: selectedOrganization === 'alapitvany' ? 'Alapítvány' : 'Óvoda'
        }
      });
      if (payrollError) {
        throw new Error(`Payroll processing error: ${payrollError.message}`);
      }
      if (payrollData?.success) {
        setExtractedRecords(payrollData.data);
        // Set current month year for file organization
        const firstRecord = payrollData.data[0];
        if (firstRecord?.date) {
          const recordDate = new Date(firstRecord.date);
          const monthYear = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
          setCurrentMonthYear(monthYear);
        }
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
    setStep('cash-question');
  };
  const handleCashYes = () => {
    setShowCashModal(true);
  };
  const handleCashNo = () => {
    setShowTaxModal(true);
  };
  const handleCashFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('error', 'Csak JPG, PNG és PDF fájlokat lehet feltölteni.');
      return;
    }
    setIsProcessingCash(true);
    setUploadedCashFile(file);
    try {
      // Convert file to base64 and process with Document AI first
      const base64Data = await convertFileToBase64(file);

      // Send to process-document function first
      const {
        data,
        error
      } = await supabase.functions.invoke('process-document', {
        body: {
          document: {
            content: base64Data,
            mimeType: file.type
          }
        }
      });
      if (error) {
        throw new Error(`Document processing error: ${error.message}`);
      }
      if (!data?.document?.text) {
        throw new Error('No text extracted from document');
      }

      // Now send to payroll-cash-gemini edge function
      const {
        data: cashData,
        error: cashError
      } = await supabase.functions.invoke('payroll-cash-gemini', {
        body: {
          extractedText: data.document.text,
          organization: selectedOrganization
        }
      });
      if (cashError) {
        throw new Error(`Cash payroll processing error: ${cashError.message}`);
      }
      if (cashData?.success) {
        setCashRecords(cashData.records || []);
        setShowCashModal(false);
        setStep('cash-preview');
        addNotification('success', 'Készpénzes jövedelem adatok sikeresen kinyerve!');
      } else {
        throw new Error(cashData?.error || 'Ismeretlen hiba történt');
      }
    } catch (error) {
      console.error('Error processing cash file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt a készpénzes adatok feldolgozása során: ${errorMessage}`);
    } finally {
      setIsProcessingCash(false);
    }
  }, [addNotification]);
  const handleCashRendbenClick = () => {
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
    setUploadedTaxFile(file);
    try {
      // Convert file to base64 and process with Document AI first
      const base64Data = await convertFileToBase64(file);

      // Send to process-document function first
      const {
        data,
        error
      } = await supabase.functions.invoke('process-document', {
        body: {
          document: {
            content: base64Data,
            mimeType: file.type
          }
        }
      });
      if (error) {
        throw new Error(`Document processing error: ${error.message}`);
      }
      if (!data?.document?.text) {
        throw new Error('No text extracted from document');
      }

      // Now send to tax-gemini edge function
      const {
        data: taxData,
        error: taxError
      } = await supabase.functions.invoke('tax-gemini', {
        body: {
          extractedText: data.document.text,
          organization: selectedOrganization === 'alapitvany' ? 'Alapítvány' : 'Óvoda'
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
    if (extractedRecords.length === 0 && cashRecords.length === 0) {
      addNotification('error', 'Nincs menthető adat.');
      return;
    }
    if (!selectedOrganization) {
      addNotification('error', 'Válaszd ki a szervezetet a mentéshez.');
      return;
    }
    try {
      setIsSaving(true);
      // Get current user
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Nem vagy bejelentkezve');
      }

      // Upload files to storage (non-blocking per file)
      let payrollFileUrl = '';
      let cashFileUrl = '';
      let taxFileUrl = '';
      if (uploadedPayrollFile && currentMonthYear) {
        try {
          payrollFileUrl = await uploadFileToStorage(uploadedPayrollFile, 'payroll', currentMonthYear);
        } catch (e) {
          console.error('Payroll file upload failed:', e);
          addNotification('info', 'A bérköltség fájl feltöltése nem sikerült, a mentés folytatódik fájllink nélkül.');
        }
      }
      if (uploadedCashFile && currentMonthYear) {
        try {
          cashFileUrl = await uploadFileToStorage(uploadedCashFile, 'payroll', currentMonthYear);
        } catch (e) {
          console.error('Cash file upload failed:', e);
          addNotification('info', 'A készpénzes fájl feltöltése nem sikerült, a mentés folytatódik fájllink nélkül.');
        }
      }
      if (uploadedTaxFile && currentMonthYear) {
        try {
          taxFileUrl = await uploadFileToStorage(uploadedTaxFile, 'tax-documents', currentMonthYear);
        } catch (e) {
          console.error('Tax file upload failed:', e);
          addNotification('info', 'Az adó fájl feltöltése nem sikerült, a mentés folytatódik fájllink nélkül.');
        }
      }

      // Combine all records (regular + cash)
      const allRecords = [...extractedRecords.map(record => ({
        employee_name: record.employeeName,
        project_code: record.projectCode,
        amount: record.amount,
        record_date: record.date,
        is_rental: record.isRental,
        is_cash: false,
        organization: selectedOrganization,
        uploaded_by: user.id
      })), ...cashRecords.map(record => ({
        employee_name: record.employeeName,
        project_code: record.projectCode,
        amount: record.amount,
        record_date: record.date,
        is_rental: record.isRental || false,
        is_cash: true,
        organization: selectedOrganization,
        uploaded_by: user.id
      }))];

      // Save individual records
      if (allRecords.length > 0) {
        const {
          error: recordsError
        } = await supabase.from('payroll_records').insert(allRecords);
        if (recordsError) throw recordsError;
      }

      // Update or create monthly summary
      let year: number;
      let month: number;
      if (currentMonthYear) {
        const [yStr, mStr] = currentMonthYear.split('-');
        year = parseInt(yStr, 10);
        month = parseInt(mStr, 10);
      } else {
        const firstRecord = extractedRecords[0] || cashRecords[0];
        const recordDate = new Date(firstRecord.date);
        if (isNaN(recordDate.getTime())) {
          const now = new Date();
          year = now.getFullYear();
          month = now.getMonth() + 1;
        } else {
          year = recordDate.getFullYear();
          month = recordDate.getMonth() + 1;
        }
      }
      console.log('Creating summary for:', {
        year,
        month,
        organization: selectedOrganization
      });
      const payrollTotal = extractedRecords.reduce((sum, r) => sum + r.amount, 0);
      const cashTotal = cashRecords.reduce((sum, r) => sum + r.amount, 0);
      const totalPayroll = payrollTotal + cashTotal;
      const rentalCosts = [...extractedRecords.filter(r => r.isRental), ...cashRecords.filter(r => r.isRental)].reduce((sum, r) => sum + r.amount, 0);
      const nonRentalCosts = totalPayroll - rentalCosts;
      const {
        error: summaryError
      } = await supabase.from('payroll_summaries').upsert({
        year,
        month,
        organization: selectedOrganization,
        total_payroll: totalPayroll + taxAmount,
        rental_costs: rentalCosts,
        non_rental_costs: nonRentalCosts,
        cash_costs: cashTotal,
        bank_transfer_costs: payrollTotal,
        record_count: extractedRecords.length + cashRecords.length,
        tax_amount: taxAmount,
        payroll_file_url: payrollFileUrl || null,
        cash_file_url: cashFileUrl || null,
        tax_file_url: taxFileUrl || null,
        created_by: user.id
      }, {
        onConflict: 'year,month,organization'
      });
      if (summaryError) throw summaryError;
      addNotification('success', 'Bérköltség adatok sikeresen mentve!');
      setExtractedRecords([]);
      setCashRecords([]);
      setStep('organization');
      setUploadedPayrollFile(null);
      setUploadedCashFile(null);
      setUploadedTaxFile(null);
      setPayrollFileUrl('');
      setTaxAmount(0);
      setCurrentMonthYear('');
      setSelectedOrganization('');
      await loadPayrollSummaries();
    } catch (error) {
      console.error('Error saving payroll records:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt a mentés során: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };
  const loadPayrollSummaries = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('payroll_summaries').select('*').order('year', {
        ascending: false
      }).order('month', {
        ascending: false
      });
      if (error) throw error;

      // Ensure tax_amount exists in the data, default to 0 if missing, handle null values for file URLs
      const summariesWithTax = (data || []).map(summary => ({
        ...summary,
        tax_amount: (summary as any).tax_amount || 0,
        payroll_file_url: (summary as any).payroll_file_url || undefined,
        cash_file_url: (summary as any).cash_file_url || undefined,
        tax_file_url: (summary as any).tax_file_url || undefined
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
      const {
        data,
        error
      } = await supabase.from('payroll_records').select('*').eq('organization', organization).gte('record_date', `${year}-${month.toString().padStart(2, '0')}-01`).lt('record_date', `${year}-${(month + 1).toString().padStart(2, '0')}-01`).order('record_date', {
        ascending: true
      });
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

      // First get the record details before deletion to update summary
      const recordMonth = new Date(record.date).getMonth() + 1;
      const recordYear = new Date(record.date).getFullYear();
      const {
        error
      } = await supabase.from('payroll_records').delete().eq('id', record.id);
      if (error) throw error;

      // Update the corresponding payroll summary by recalculating totals
      const {
        data: remainingRecords,
        error: fetchError
      } = await supabase.from('payroll_records').select('*').eq('organization', record.organization).gte('record_date', `${recordYear}-${recordMonth.toString().padStart(2, '0')}-01`).lt('record_date', `${recordYear}-${(recordMonth + 1).toString().padStart(2, '0')}-01`);
      if (fetchError) {
        console.error('Error fetching remaining records:', fetchError);
      } else {
        // Recalculate summary totals
        const bankTransferCosts = remainingRecords?.filter(r => !r.is_cash).reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;
        const cashCosts = remainingRecords?.filter(r => r.is_cash).reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;
        const rentalCosts = remainingRecords?.filter(r => r.is_rental).reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;
        const nonRentalCosts = remainingRecords?.filter(r => !r.is_rental).reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0) || 0;
        const recordCount = remainingRecords?.length || 0;

        // Get existing summary to preserve tax_amount
        const {
          data: existingSummary
        } = await supabase.from('payroll_summaries').select('tax_amount').eq('organization', record.organization).eq('year', recordYear).eq('month', recordMonth).single();
        const taxAmount = parseFloat(existingSummary?.tax_amount?.toString() || '0');
        const totalPayroll = bankTransferCosts + cashCosts + taxAmount;

        // Update the summary
        const {
          error: updateError
        } = await supabase.from('payroll_summaries').update({
          bank_transfer_costs: bankTransferCosts,
          cash_costs: cashCosts,
          rental_costs: rentalCosts,
          non_rental_costs: nonRentalCosts,
          total_payroll: totalPayroll,
          record_count: recordCount,
          updated_at: new Date().toISOString()
        }).eq('organization', record.organization).eq('year', recordYear).eq('month', recordMonth);
        if (updateError) {
          console.error('Error updating summary:', updateError);
        }
      }
      addNotification('success', 'Rekord sikeresen törölve és összesítő frissítve');

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
      const {
        error: recordsError
      } = await supabase.from('payroll_records').delete().eq('organization', summary.organization).gte('record_date', `${summary.year}-${summary.month.toString().padStart(2, '0')}-01`).lt('record_date', `${summary.year}-${(summary.month + 1).toString().padStart(2, '0')}-01`);
      if (recordsError) throw recordsError;

      // Then delete the summary
      const {
        error: summaryError
      } = await supabase.from('payroll_summaries').delete().eq('year', summary.year).eq('month', summary.month).eq('organization', summary.organization);
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
    setEditingRecord({
      ...record
    });
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
      const {
        error
      } = await supabase.from('payroll_records').update({
        employee_name: editingRecord.employeeName,
        project_code: editingRecord.projectCode,
        amount: editingRecord.amount,
        record_date: editingRecord.date,
        is_rental: editingRecord.isRental,
        organization: editingRecord.organization
      }).eq('id', editingRecordId);
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
  const formatMonth = (year: number, month: number) => {
    return `${year}.${month.toString().padStart(2, '0')}`;
  };
  const downloadMonthlyDocuments = async (summary: PayrollSummary) => {
    try {
      const monthYear = `${summary.year}-${String(summary.month).padStart(2, '0')}`;
      const files: {
        bucket: string;
        path: string;
      }[] = [];
      if (summary.payroll_file_url) files.push({
        bucket: 'payroll',
        path: summary.payroll_file_url
      });
      if (summary.cash_file_url) files.push({
        bucket: 'payroll',
        path: summary.cash_file_url
      });
      if (summary.tax_file_url) files.push({
        bucket: 'tax-documents',
        path: summary.tax_file_url
      });
      if (files.length === 0) {
        addNotification('info', 'Ehhez a hónaphoz nincsenek feltöltött dokumentumok.');
        return;
      }
      for (const file of files) {
        const {
          data,
          error
        } = await supabase.storage.from(file.bucket).download(file.path);
        if (error) {
          console.error('Error downloading file:', error);
          continue;
        }
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.path.split('/').pop() || `document_${monthYear}`;
        a.click();
        URL.revokeObjectURL(url);
      }
      addNotification('success', `${files.length} dokumentum letöltése elindult.`);
    } catch (error) {
      console.error('Error downloading documents:', error);
      addNotification('error', 'Hiba történt a dokumentumok letöltése során');
    }
  };
  return <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
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

      {/* Organization Selection Section */}
      {step === 'organization' && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
            Szervezet kiválasztása
          </h3>
          
          <p className="text-gray-600 mb-6">
            Válaszd ki, melyik szervezet bérköltségeit szeretnéd feltölteni:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => {
          setSelectedOrganization('alapitvany');
          setStep('upload');
        }} className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Feketerigó Alapítvány</h4>
              <p className="text-sm text-gray-600">
                Alapítványi bérköltségek feltöltése
              </p>
            </button>
            
            <button onClick={() => {
          setSelectedOrganization('ovoda');
          setStep('upload');
        }} className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Feketerigó Alapítványi Óvoda</h4>
              <p className="text-sm text-gray-600">
                Óvodai bérköltségek feltöltése
              </p>
            </button>
          </div>
        </div>}

      {/* Upload Section - Only show when no file is uploaded */}
      {step === 'upload' && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
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
                <input id="payroll-upload" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileUpload} disabled={isUploading} className="hidden" />
              </label>
              <div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto" disabled={isUploading} onClick={() => document.getElementById('payroll-upload')?.click()}>
                  {isUploading ? <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Feldolgozás...
                    </> : <>
                      <Upload className="h-4 w-4" />
                      Feldolgozásra küldés
                    </>}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-start">
            <button onClick={() => {
          setStep('organization');
          setSelectedOrganization('');
        }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Vissza a szervezet kiválasztáshoz
            </button>
          </div>
        </div>}

      {/* Preview Section */}
      {step === 'preview' && uploadedPayrollFile && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
            Bérköltség dokumentum előnézet és kinyert adatok
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Preview */}
            <div>
              <div className="border border-gray-200 rounded-lg overflow-hidden h-[600px]">
                {uploadedPayrollFile.type === 'application/pdf' ? <div className="h-full bg-gray-100 flex flex-col items-center justify-center p-4">
                    
                    {/* PDF Viewer */}
                    <div className="w-full flex-1">
                      <iframe src={payrollFileUrl} title="PDF előnézet" className="w-full h-full border-0 rounded" />
                    </div>
                  </div> : <div className="bg-gray-50 p-4 h-full flex items-center justify-center">
                    <img src={payrollFileUrl} alt="Bérköltség dokumentum" className="w-full max-w-none h-full object-contain mx-auto" />
                  </div>}
              </div>
            </div>

            {/* Extracted Data */}
            <div>
              <div className="border border-gray-200 rounded-lg overflow-hidden h-[600px]">
                <div className="h-full overflow-y-auto">
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
                      {extractedRecords.map((record, index) => <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">
                            {record.employeeName}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {formatCurrency(record.amount)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {record.projectCode || '—'}
                          </td>
                        </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => {
          setStep('organization');
          setUploadedPayrollFile(null);
          setPayrollFileUrl('');
          setExtractedRecords([]);
          setSelectedOrganization('');
        }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Vissza
            </button>
            <button onClick={handleRendbenClick} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Rendben - Folytatás adókkal
            </button>
          </div>
        </div>}

      {/* Cash Modal */}
      {showCashModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Készpénzes jövedelem dokumentum feltöltése</h3>
            <p className="text-sm text-gray-600 mb-4">
              Töltsd fel a készpénzes jövedelem dokumentumot a készpénzes kifizetések kinyeréséhez.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="space-y-2">
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleCashFileUpload} disabled={isProcessingCash} className="hidden" id="cash-file-upload" />
                <button onClick={() => document.getElementById('cash-file-upload')?.click()} disabled={isProcessingCash} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isProcessingCash ? 'Feldolgozás...' : 'Fájl kiválasztás'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button onClick={() => setShowCashModal(false)} disabled={isProcessingCash} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                Mégse
              </button>
            </div>
          </div>
        </div>}

      {/* Tax Modal */}
      {showTaxModal && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adó dokumentum feltöltése</h3>
            <p className="text-sm text-gray-600 mb-4">
              Töltsd fel az adó dokumentumot a járulékok összegének kinyeréséhez.
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <label htmlFor="tax-upload" className="cursor-pointer">
                <span className="text-sm text-gray-600">
                  Válassz adó dokumentumot (JPG, PNG, PDF)
                </span>
                <input id="tax-upload" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleTaxFileUpload} disabled={isProcessingTax} className="hidden" />
              </label>
              <div className="mt-2">
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50" disabled={isProcessingTax} onClick={() => document.getElementById('tax-upload')?.click()}>
                  {isProcessingTax ? 'Feldolgozás...' : 'Fájl kiválasztás'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button onClick={() => setShowTaxModal(false)} disabled={isProcessingTax} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                Mégse
              </button>
            </div>
          </div>
        </div>}

      {/* Cash Payment Question Section */}
      {step === 'cash-question' && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
            Készpénzes jövedelem dokumentum
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Van-e készpénzes jövedelem dokumentumod ehhez a hónaphoz?
            </p>
          </div>

          <div className="flex gap-4">
            <button onClick={handleCashYes} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Igen, van dokumentum
            </button>
            <button onClick={handleCashNo} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Nincs, folytatás adókkal
            </button>
          </div>
        </div>}

      {/* Cash Document Preview Section */}
      {step === 'cash-preview' && uploadedCashFile && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Preview */}
            <div>
              <div className="border border-gray-200 rounded-lg overflow-hidden h-[600px]">
                {uploadedCashFile.type === 'application/pdf' ? <div className="h-full bg-gray-100 flex flex-col items-center justify-center p-4">
                    <div className="text-center mb-4">
                      <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">PDF dokumentum</p>
                      <p className="text-sm text-gray-500">{uploadedCashFile.name}</p>
                    </div>
                    {/* PDF Viewer */}
                    <div className="w-full flex-1">
                      <iframe src={URL.createObjectURL(uploadedCashFile)} title="PDF előnézet" className="w-full h-full border-0 rounded" />
                    </div>
                  </div> : <div className="bg-gray-50 p-4 h-[600px] flex items-center justify-center">
                    <img src={URL.createObjectURL(uploadedCashFile)} alt="Készpénzes dokumentum előnézet" className="w-full max-w-none h-full object-contain mx-auto" />
                  </div>}
              </div>
            </div>

            {/* Extracted Data */}
            <div>
              {cashRecords.length > 0 ? <div className="border border-gray-200 rounded-lg overflow-hidden h-[600px]">
                  <div className="h-full overflow-y-auto">
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
                            Dátum
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Munkaszám
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cashRecords.map((record, index) => <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">
                              {record.employeeName}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {formatCurrency(record.amount)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-500">
                              {record.date}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {record.projectCode || '—'}
                            </td>
                          </tr>)}
                      </tbody>
                    </table>
                  </div>
                </div> : <div className="border border-gray-200 rounded-lg h-[600px] flex items-center justify-center">
                  <p className="text-gray-500">Nem sikerült készpénzes adatokat kinyerni a dokumentumból.</p>
                </div>}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={() => {
          setStep('cash-question');
          setCashRecords([]);
          setUploadedCashFile(null);
        }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Vissza
            </button>
            <button onClick={handleCashRendbenClick} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Rendben - Folytatás adókkal
            </button>
          </div>
        </div>}

      {/* Confirm Section */}
      {step === 'confirm' && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
            Adatok mentésre készen
          </h3>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-green-800">
                Bérköltség adatok és adó összeg sikeresen feldolgozva. Kattints a "Adatok mentése" gombra a véglegesítéshez.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Banki átutalás</h4>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(extractedRecords.reduce((sum, r) => sum + r.amount, 0))}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Készpénz</h4>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(cashRecords.reduce((sum, r) => sum + r.amount, 0))}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Adók és járulékok</h4>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(taxAmount)}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Teljes összeg</h4>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(extractedRecords.reduce((sum, r) => sum + r.amount, 0) + cashRecords.reduce((sum, r) => sum + r.amount, 0) + taxAmount)}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button onClick={() => setStep('preview')} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Vissza
            </button>
            <button onClick={saveRecords} disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Mentés...
                </> : <>
                  <Save className="h-4 w-4" />
                  Adatok mentése
                </>}
            </button>
          </div>
        </div>}

      {/* Monthly Summary History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Havi bérköltség összesítők
        </h3>
        
        <div className="overflow-x-auto">
          {payrollSummaries.length === 0 ? <div className="text-center py-8">
              <p className="text-gray-500">Még nincsenek mentett bérköltség összesítők.</p>
            </div> : <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hónap
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Szervezet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Összes bérköltség
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banki átutalás
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Készpénz
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
                    Járulékok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Műveletek
                  </th>
                </tr>
              </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {payrollSummaries.map(summary => <tr key={summary.id} className={`hover:bg-gray-50 ${summary.organization === 'alapitvany' ? 'border-l-4 border-l-blue-500' : summary.organization === 'ovoda' ? 'border-l-4 border-l-orange-500' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatMonth(summary.year, summary.month)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-600">
                        {summary.organization === 'alapitvany' ? 'Feketerigó Alapítvány' : summary.organization === 'ovoda' ? 'Feketerigó Alapítványi Óvoda' : summary.organization}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-medium text-gray-900">{formatCurrency(summary.total_payroll)}</span>
                       <div className="text-xs text-gray-500">Bruttó + járulékok</div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-medium text-blue-600">{formatCurrency(summary.bank_transfer_costs || 0)}</span>
                       <div className="text-xs text-gray-500">Banki utalások</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-medium text-orange-600">{formatCurrency(summary.cash_costs || 0)}</span>
                       <div className="text-xs text-gray-500">Készpénzes</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-medium text-gray-900">{formatCurrency(summary.rental_costs)}</span>
                       <div className="text-xs text-gray-500">Bérleti díjak</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-medium text-gray-900">{formatCurrency(summary.non_rental_costs)}</span>
                       <div className="text-xs text-gray-500">Nem bérleti</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-medium text-gray-900">{summary.record_count}</span>
                       <div className="text-xs text-gray-500">db</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm font-medium text-purple-600">{formatCurrency(summary.tax_amount)}</span>
                       <div className="text-xs text-gray-500">Társadalmi járulékok</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex gap-2">
                         <button onClick={() => viewMonthlyRecords(summary.year, summary.month, summary.organization)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1" title="Részletek megtekintése">
                           <CheckCircle2 className="h-4 w-4" />
                           Részletek
                         </button>
                         <button onClick={() => downloadMonthlyDocuments(summary)} className="text-green-600 hover:text-green-800 flex items-center gap-1" title="Havi dokumentumok letöltése">
                           <Download className="h-4 w-4" />
                           Letöltés
                         </button>
                         <button onClick={() => setDeleteConfirmSummary(summary)} className="text-red-600 hover:text-red-800 flex items-center gap-1" title="Teljes havi összesítő törlése">
                           <Trash2 className="h-4 w-4" />
                           Törlés
                         </button>
                       </div>
                     </td>
                  </tr>)}
              </tbody>
            </table>}
        </div>
      </div>

      {/* Monthly Records Detail Modal */}
      {viewingRecords.length > 0 && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-gray-200">
               <div className="flex justify-between items-center">
                 <div>
                   <h3 className="text-lg font-semibold text-gray-900">
                     Bérköltség részletek - {viewingMonth}
                   </h3>
                   <p className="text-sm text-gray-600 mt-1">
                     {viewingRecords[0]?.organization === 'alapitvany' ? 'Feketerigó Alapítvány' : viewingRecords[0]?.organization === 'ovoda' ? 'Feketerigó Alapítványi Óvoda' : viewingRecords[0]?.organization || 'Ismeretlen szervezet'} - {viewingRecords.length} rekord
                   </p>
                 </div>
                <button onClick={() => {
              setViewingRecords([]);
              setViewingMonth('');
            }} className="text-gray-400 hover:text-gray-600">
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
                  {viewingRecords.map(record => {
                  // Find the summary for this month AND organization to get tax_amount
                  const currentSummary = payrollSummaries.find(s => s.year === parseInt(viewingMonth.split('.')[0]) && s.month === parseInt(viewingMonth.split('.')[1]) && s.organization === viewingRecords[0]?.organization);
                  const monthlyTaxAmount = currentSummary?.tax_amount || 0;
                  const totalPayrollForMonth = viewingRecords.reduce((sum, r) => sum + r.amount, 0);
                  const employeeTaxShare = totalPayrollForMonth > 0 ? record.amount * monthlyTaxAmount / totalPayrollForMonth : 0;
                  return <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRecordId === record.id ? <input type="text" value={editingRecord?.employeeName || ''} onChange={e => updateEditingRecord('employeeName', e.target.value)} className="w-full p-1 border rounded" /> : <span className="text-sm font-medium text-gray-900">{record.employeeName}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRecordId === record.id ? <input type="text" value={editingRecord?.projectCode || ''} onChange={e => updateEditingRecord('projectCode', e.target.value)} className="w-full p-1 border rounded" /> : <span className="text-sm text-gray-900">{record.projectCode || '—'}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRecordId === record.id ? <input type="number" value={editingRecord?.amount || 0} onChange={e => updateEditingRecord('amount', Number(e.target.value))} className="w-full p-1 border rounded" /> : <span className="text-sm text-gray-900">{formatCurrency(record.amount)}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{formatCurrency(employeeTaxShare)}</span>
                        </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {editingRecordId === record.id ? <input type="date" value={editingRecord?.date || ''} onChange={e => updateEditingRecord('date', e.target.value)} className="w-full p-1 border rounded" /> : <span className="text-sm text-gray-900">{record.date}</span>}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {editingRecordId === record.id ? <input type="checkbox" checked={editingRecord?.isRental || false} onChange={e => updateEditingRecord('isRental', e.target.checked)} className="w-4 h-4" /> : <span className="text-sm">
                               {record.isRental ? '✅' : '❌'}
                             </span>}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           {editingRecordId === record.id ? <div className="flex gap-2">
                               <button onClick={saveEditedRecord} className="text-green-600 hover:text-green-800" title="Mentés">
                                 <Save className="h-4 w-4" />
                               </button>
                               <button onClick={cancelEditingRecord} className="text-gray-600 hover:text-gray-800" title="Mégse">
                                 <X className="h-4 w-4" />
                               </button>
                             </div> : <div className="flex gap-2">
                               <button onClick={() => startEditingRecord(record)} className="text-blue-600 hover:text-blue-800" title="Szerkesztés">
                                 <Edit3 className="h-4 w-4" />
                               </button>
                               <button onClick={() => setDeleteConfirmRecord(record)} className="text-red-600 hover:text-red-800" title="Törlés">
                                 <Trash2 className="h-4 w-4" />
                               </button>
                             </div>}
                         </td>
                        </tr>;
                })}
                   
                  </tbody>
                </table>
              </div>
              
              {/* Summary Table for Current Month */}
              {viewingRecords.length > 0 && (() => {
            const currentSummary = payrollSummaries.find(s => s.year === parseInt(viewingMonth.split('.')[0]) && s.month === parseInt(viewingMonth.split('.')[1]) && s.organization === viewingRecords[0]?.organization);
            return <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Havi összesítő - {currentSummary?.organization === 'alapitvany' ? 'Feketerigó Alapítvány' : currentSummary?.organization === 'ovoda' ? 'Feketerigó Alapítványi Óvoda' : currentSummary?.organization || 'Ismeretlen szervezet'}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hónap
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Szervezet
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Összes bérköltség
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Banki átutalás
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Készpénz
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
                              Járulékok
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">{viewingMonth}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-600">
                                {currentSummary?.organization === 'alapitvany' ? 'Feketerigó Alapítvány' : currentSummary?.organization === 'ovoda' ? 'Feketerigó Alapítványi Óvoda' : currentSummary?.organization}
                              </span>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                               <span className="text-sm font-bold text-gray-900">
                                 {formatCurrency(currentSummary?.total_payroll || 0)}
                               </span>
                               <div className="text-xs text-gray-500 mt-1">
                                 Bruttó bér + járulékok
                               </div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                               <span className="text-sm font-bold text-blue-600">
                                 {formatCurrency(currentSummary?.bank_transfer_costs || 0)}
                               </span>
                               <div className="text-xs text-gray-500 mt-1">
                                 Banki utalások összege
                               </div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                               <span className="text-sm font-bold text-orange-600">
                                 {formatCurrency(currentSummary?.cash_costs || 0)}
                               </span>
                               <div className="text-xs text-gray-500 mt-1">
                                 Készpénzes kifizetések
                               </div>
                             </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(currentSummary?.rental_costs || 0)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-bold text-gray-900">
                                {formatCurrency(currentSummary?.non_rental_costs || 0)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-bold text-gray-900">
                                {currentSummary?.record_count || 0}
                              </span>
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                               <span className="text-sm font-bold text-purple-600">
                                 {formatCurrency(currentSummary?.tax_amount || 0)}
                               </span>
                               <div className="text-xs text-gray-500 mt-1">
                                 Társadalmi járulékok
                               </div>
                             </td>
                          </tr>
                         </tbody>
                       </table>
                     </div>
                     
                     {/* Additional calculation breakdown */}
                     <div className="mt-4 bg-blue-50 rounded-lg p-4">
                       <h5 className="text-sm font-semibold text-gray-900 mb-3">Számítási részletezés</h5>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span>Bruttó bérek:</span>
                             <span className="font-medium">
                               {formatCurrency((currentSummary?.bank_transfer_costs || 0) + (currentSummary?.cash_costs || 0))}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span>+ Társadalmi járulékok:</span>
                             <span className="font-medium text-purple-600">
                               {formatCurrency(currentSummary?.tax_amount || 0)}
                             </span>
                           </div>
                           <div className="flex justify-between border-t pt-2">
                             <span className="font-semibold">= Teljes költség:</span>
                             <span className="font-bold">
                               {formatCurrency(currentSummary?.total_payroll || 0)}
                             </span>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span>Bérleti költségek:</span>
                             <span className="font-medium">
                               {formatCurrency(currentSummary?.rental_costs || 0)}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span>Nem bérleti:</span>
                             <span className="font-medium">
                               {formatCurrency(currentSummary?.non_rental_costs || 0)}
                             </span>
                           </div>
                           <div className="flex justify-between border-t pt-2">
                             <span className="font-semibold">Összesen:</span>
                             <span className="font-bold">
                               {formatCurrency((currentSummary?.rental_costs || 0) + (currentSummary?.non_rental_costs || 0))}
                             </span>
                           </div>
                         </div>
                         <div className="space-y-2">
                           <div className="flex justify-between">
                             <span>Banki átutalások:</span>
                             <span className="font-medium text-blue-600">
                               {formatCurrency(currentSummary?.bank_transfer_costs || 0)}
                             </span>
                           </div>
                           <div className="flex justify-between">
                             <span>Készpénzes:</span>
                             <span className="font-medium text-orange-600">
                               {formatCurrency(currentSummary?.cash_costs || 0)}
                             </span>
                           </div>
                           <div className="flex justify-between border-t pt-2">
                             <span className="font-semibold">Összesen:</span>
                             <span className="font-bold">
                               {formatCurrency((currentSummary?.bank_transfer_costs || 0) + (currentSummary?.cash_costs || 0))}
                             </span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>;
          })()}
            </div>
          </div>
          </div>}

        {/* Delete Record Confirmation Modal */}
        {deleteConfirmRecord && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                <button onClick={() => setDeleteConfirmRecord(null)} disabled={deleting} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                  Mégse
                </button>
                <button onClick={() => handleDeleteRecord(deleteConfirmRecord)} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2">
                  {deleting ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Törlés...</span>
                    </> : <>
                      <Trash2 className="h-4 w-4" />
                      <span>Törlés</span>
                    </>}
                </button>
              </div>
            </div>
          </div>}

        {/* Delete Monthly Summary Confirmation Modal */}
        {deleteConfirmSummary && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                <button onClick={() => setDeleteConfirmSummary(null)} disabled={deleting} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                  Mégse
                </button>
                <button onClick={() => handleDeleteMonthlyPayroll(deleteConfirmSummary)} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2">
                  {deleting ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Törlés...</span>
                    </> : <>
                      <Trash2 className="h-4 w-4" />
                      <span>Törlés</span>
                    </>}
                </button>
              </div>
            </div>
          </div>}
      </div>;
};
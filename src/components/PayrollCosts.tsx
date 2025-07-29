import React, { useState } from 'react';
import { DollarSign, Upload, CheckCircle2, Edit3, Save, X, Trash2, AlertTriangle } from 'lucide-react';
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
  
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<PayrollRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<PayrollRecord | null>(null);
  const [deleteConfirmSummary, setDeleteConfirmSummary] = useState<PayrollSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [payrollSummaries, setPayrollSummaries] = useState<PayrollSummary[]>([]);
  const [viewingRecords, setViewingRecords] = useState<PayrollRecord[]>([]);
  const [viewingMonth, setViewingMonth] = useState<string>('');
  
  // New workflow state
  const [payrollFile, setPayrollFile] = useState<File | null>(null);
  const [payrollPreview, setPayrollPreview] = useState<string>('');
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [payrollProcessed, setPayrollProcessed] = useState(false);
  const [showTaxUploadModal, setShowTaxUploadModal] = useState(false);
  const [isProcessingTax, setIsProcessingTax] = useState(false);
  const [extractedTaxAmount, setExtractedTaxAmount] = useState<number>(0);
  const [finalDataReady, setFinalDataReady] = useState(false);
  const [currentPayrollFileUrl, setCurrentPayrollFileUrl] = useState<string>('');
  const [currentTaxFileUrl, setCurrentTaxFileUrl] = useState<string>('');
  
  const { addNotification } = useNotifications();

  const createFilePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('hu-HU');
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
    await processPayrollFile(file);
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
      setPayrollProcessed(true);
      addNotification('success', 'Bérköltség dokumentum sikeresen feldolgozva!');
      
    } catch (error) {
      console.error('💥 Error processing payroll file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt a bérköltség feldolgozása során: ${errorMessage}`);
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleRendben = () => {
    setShowTaxUploadModal(true);
  };

  const handleTaxFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      addNotification('error', 'Csak JPG, PNG és PDF fájlokat lehet feltölteni.');
      return;
    }
    
    await processTaxFile(file);
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
        setFinalDataReady(true);
        setShowTaxUploadModal(false);
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

      const totalPayroll = extractedRecords.reduce((sum, r) => sum + r.amount, 0);
      const rentalCosts = extractedRecords.filter(r => r.isRental).reduce((sum, r) => sum + r.amount, 0);
      const nonRentalCosts = totalPayroll - rentalCosts;

      const { error: summaryError } = await supabase
        .from('payroll_summaries')
        .upsert({
          year,
          month,
          organization: firstRecord.organization,
          total_payroll: totalPayroll + extractedTaxAmount, // Add tax to total
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
      
      // Reset form
      resetForm();
      await loadPayrollSummaries();
    } catch (error) {
      console.error('Error saving payroll records:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba történt';
      addNotification('error', `Hiba történt a mentés során: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setExtractedRecords([]);
    setExtractedTaxAmount(0);
    setCurrentPayrollFileUrl('');
    setCurrentTaxFileUrl('');
    setPayrollFile(null);
    setPayrollProcessed(false);
    setFinalDataReady(false);
    if (payrollPreview) {
      URL.revokeObjectURL(payrollPreview);
      setPayrollPreview('');
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
    if (!editingRecord || !editingRecord.id) return;

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
        .eq('id', editingRecord.id);

      if (error) throw error;

      addNotification('success', 'Rekord sikeresen frissítve');
      
      // Update local state
      setViewingRecords(viewingRecords.map(record => 
        record.id === editingRecord.id ? { ...editingRecord } : record
      ));
      
      // Refresh summaries to reflect changes
      loadPayrollSummaries();
      
      setEditingRecordId(null);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error updating record:', error);
      addNotification('error', 'Hiba történt a rekord frissítése során');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Bérköltség Kezelés</h1>
      </div>

      {/* Step 1: Payroll Document Upload */}
      {!payrollProcessed && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">1. Bérköltség dokumentum feltöltése</h2>
          
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">Töltse fel a bérköltség dokumentumot</p>
              <p className="text-sm text-muted-foreground">JPG, PNG vagy PDF formátum</p>
            </div>
            <input
              type="file"
              onChange={handlePayrollFileUpload}
              accept=".jpg,.jpeg,.png,.pdf"
              className="mt-4 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={isProcessingPayroll}
            />
          </div>

          {isProcessingPayroll && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                Feldolgozás folyamatban...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Payroll Data Review */}
      {payrollProcessed && !finalDataReady && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Extracted Data Column */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Kinyert adatok</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-medium text-foreground">Alkalmazott</th>
                    <th className="text-left p-2 font-medium text-foreground">Projekt</th>
                    <th className="text-left p-2 font-medium text-foreground">Összeg</th>
                    <th className="text-left p-2 font-medium text-foreground">Dátum</th>
                    <th className="text-left p-2 font-medium text-foreground">Bérlő</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedRecords.map((record, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={record.employeeName}
                          onChange={(e) => updateRecord(index, 'employeeName', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={record.projectCode || ''}
                          onChange={(e) => updateRecord(index, 'projectCode', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={record.amount}
                          onChange={(e) => updateRecord(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="date"
                          value={record.date}
                          onChange={(e) => updateRecord(index, 'date', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={record.isRental}
                          onChange={(e) => updateRecord(index, 'isRental', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={handleRendben}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
              >
                Rendben
              </button>
            </div>
          </div>

          {/* Document Preview Column */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Dokumentum előnézet</h2>
            
            {payrollPreview && (
              <div className="border border-border rounded-lg overflow-hidden">
                {payrollFile?.type === 'application/pdf' ? (
                  <iframe
                    src={payrollPreview}
                    className="w-full h-96"
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={payrollPreview}
                    alt="Document preview"
                    className="w-full h-96 object-contain bg-muted"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Final Combined Data */}
      {finalDataReady && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Végső jelentés</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium text-foreground">Alkalmazott</th>
                  <th className="text-left p-2 font-medium text-foreground">Projekt</th>
                  <th className="text-left p-2 font-medium text-foreground">Összeg</th>
                  <th className="text-left p-2 font-medium text-foreground">Dátum</th>
                  <th className="text-left p-2 font-medium text-foreground">Bérlő</th>
                  <th className="text-left p-2 font-medium text-foreground">Járulékok</th>
                </tr>
              </thead>
              <tbody>
                {extractedRecords.map((record, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="p-2 text-foreground">{record.employeeName}</td>
                    <td className="p-2 text-foreground">{record.projectCode || '-'}</td>
                    <td className="p-2 text-foreground">{formatCurrency(record.amount)}</td>
                    <td className="p-2 text-foreground">{formatDate(record.date)}</td>
                    <td className="p-2 text-center">{record.isRental ? '✓' : '-'}</td>
                    <td className="p-2 text-foreground">-</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-semibold bg-muted/50">
                  <td className="p-2 text-foreground" colSpan={2}>Összesítés:</td>
                  <td className="p-2 text-foreground">{formatCurrency(extractedRecords.reduce((sum, r) => sum + r.amount, 0))}</td>
                  <td className="p-2"></td>
                  <td className="p-2"></td>
                  <td className="p-2 text-foreground">{formatCurrency(extractedTaxAmount)}</td>
                </tr>
                <tr className="font-bold bg-muted">
                  <td className="p-2 text-foreground" colSpan={5}>Teljes havi költség (bérek + járulékok):</td>
                  <td className="p-2 text-foreground">{formatCurrency(extractedRecords.reduce((sum, r) => sum + r.amount, 0) + extractedTaxAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={saveRecords}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Mentés
            </button>
            <button
              onClick={resetForm}
              className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg hover:bg-secondary/90 font-medium"
            >
              Új feldolgozás
            </button>
          </div>
        </div>
      )}

      {/* Tax Upload Modal */}
      {showTaxUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Járulék dokumentum feltöltése</h3>
            
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">Töltse fel a járulék dokumentumot</p>
              <input
                type="file"
                onChange={handleTaxFileUpload}
                accept=".jpg,.jpeg,.png,.pdf"
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                disabled={isProcessingTax}
              />
            </div>

            {isProcessingTax && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                  Feldolgozás folyamatban...
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowTaxUploadModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                disabled={isProcessingTax}
              >
                Mégsem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Korábbi bérköltség összesítők</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium text-foreground">Év</th>
                <th className="text-left p-2 font-medium text-foreground">Hónap</th>
                <th className="text-left p-2 font-medium text-foreground">Szervezet</th>
                <th className="text-left p-2 font-medium text-foreground">Összeg</th>
                <th className="text-left p-2 font-medium text-foreground">Járulékok</th>
                <th className="text-left p-2 font-medium text-foreground">Teljes költség</th>
                <th className="text-left p-2 font-medium text-foreground">Rekordok</th>
                <th className="text-left p-2 font-medium text-foreground">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {payrollSummaries.map((summary) => (
                <tr key={summary.id} className="border-b border-border/50 hover:bg-muted/25">
                  <td className="p-2 text-foreground">{summary.year}</td>
                  <td className="p-2 text-foreground">{summary.month}</td>
                  <td className="p-2 text-foreground">{summary.organization}</td>
                  <td className="p-2 text-foreground">{formatCurrency(summary.total_payroll - summary.tax_amount)}</td>
                  <td className="p-2 text-foreground">{formatCurrency(summary.tax_amount)}</td>
                  <td className="p-2 text-foreground font-semibold">{formatCurrency(summary.total_payroll)}</td>
                  <td className="p-2 text-foreground">{summary.record_count}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewMonthlyRecords(summary.year, summary.month, summary.organization)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Részletek
                      </button>
                      <button
                        onClick={() => setDeleteConfirmSummary(summary)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Törlés
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Records Modal */}
      {viewingRecords.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Havi rekordok - {viewingMonth}
              </h3>
              <button
                onClick={() => {
                  setViewingRecords([]);
                  setViewingMonth('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-medium text-foreground">Alkalmazott</th>
                    <th className="text-left p-2 font-medium text-foreground">Projekt</th>
                    <th className="text-left p-2 font-medium text-foreground">Összeg</th>
                    <th className="text-left p-2 font-medium text-foreground">Dátum</th>
                    <th className="text-left p-2 font-medium text-foreground">Bérlő</th>
                    <th className="text-left p-2 font-medium text-foreground">Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingRecords.map((record) => (
                    <tr key={record.id} className="border-b border-border/50">
                      {editingRecordId === record.id ? (
                        <>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editingRecord?.employeeName || ''}
                              onChange={(e) => updateEditingRecord('employeeName', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={editingRecord?.projectCode || ''}
                              onChange={(e) => updateEditingRecord('projectCode', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={editingRecord?.amount || 0}
                              onChange={(e) => updateEditingRecord('amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              value={editingRecord?.date || ''}
                              onChange={(e) => updateEditingRecord('date', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-input rounded bg-background text-foreground"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={editingRecord?.isRental || false}
                              onChange={(e) => updateEditingRecord('isRental', e.target.checked)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <button
                                onClick={saveEditedRecord}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Mentés"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEditingRecord}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Mégsem"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 text-foreground">{record.employeeName}</td>
                          <td className="p-2 text-foreground">{record.projectCode || '-'}</td>
                          <td className="p-2 text-foreground">{formatCurrency(record.amount)}</td>
                          <td className="p-2 text-foreground">{formatDate(record.date)}</td>
                          <td className="p-2 text-center">{record.isRental ? '✓' : '-'}</td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <button
                                onClick={() => startEditingRecord(record)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Szerkesztés"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmRecord(record)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Törlés"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modals */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-foreground">Rekord törlése</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Biztosan törölni szeretné ezt a rekordot? Ez a művelet visszavonhatatlan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmRecord(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                disabled={deleting}
              >
                Mégsem
              </button>
              <button
                onClick={() => handleDeleteRecord(deleteConfirmRecord)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                disabled={deleting}
              >
                {deleting ? 'Törlés...' : 'Törlés'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-foreground">Havi összesítő törlése</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Biztosan törölni szeretné a(z) {deleteConfirmSummary.year}.{deleteConfirmSummary.month.toString().padStart(2, '0')} hónaphoz tartozó összes adatot? 
              Ez törölni fogja az összesítőt és az összes kapcsolódó rekordot is. Ez a művelet visszavonhatatlan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmSummary(null)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                disabled={deleting}
              >
                Mégsem
              </button>
              <button
                onClick={() => handleDeleteMonthlyPayroll(deleteConfirmSummary)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                disabled={deleting}
              >
                {deleting ? 'Törlés...' : 'Törlés'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
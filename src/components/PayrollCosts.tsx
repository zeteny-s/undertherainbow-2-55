import React, { useState } from 'react';
import { Upload, RotateCw, Receipt } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { convertFileToBase64, processDocumentWithAI } from '../lib/documentAI';

interface PayrollRecord {
  employeeName: string;
  projectCode: string;
  amount: number;
  date: string;
  isRental: boolean;
  jarulek?: number; // Tax amount for each employee
}


interface ExtractedData {
  records: PayrollRecord[];
  totalPayroll: number;
  totalTax: number;
}

export const PayrollCosts: React.FC = () => {
  const [payrollFile, setPayrollFile] = useState<File | null>(null);
  const [payrollData, setPayrollData] = useState<PayrollRecord[]>([]);
  
  const [isProcessingPayroll, setIsProcessingPayroll] = useState(false);
  const [isProcessingTax, setIsProcessingTax] = useState(false);
  const [payrollPreviewUrl, setPayrollPreviewUrl] = useState<string | null>(null);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [finalData, setFinalData] = useState<ExtractedData | null>(null);
  const [payrollProcessed, setPayrollProcessed] = useState(false);


  const handlePayrollFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🚀 Processing payroll file:', file.name);
    setPayrollFile(file);
    setPayrollPreviewUrl(URL.createObjectURL(file));
    setIsProcessingPayroll(true);

    try {
      // Upload to storage first
      console.log('📤 Uploading payroll file to storage');
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${crypto.randomUUID()}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payroll')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Payroll file upload failed: ${uploadError.message}`);
      }

      // Step 1: Process with Document AI (just like invoice processing)
      console.log('🔍 Processing with Document AI...');
      const base64Content = await convertFileToBase64(file);
      const extractedText = await processDocumentWithAI(base64Content, file.type);
      
      console.log('📄 Extracted text:', extractedText);

      // Step 2: Process with Gemini (just like invoice processing)
      console.log('🤖 Processing with Gemini AI...');
      const { data, error } = await supabase.functions.invoke('payroll-gemini', {
        body: {
          extractedText: extractedText,
          organization: 'auto'
        }
      });

      if (error) {
        throw new Error(`Gemini processing failed: ${error.message}`);
      }

      console.log('✅ Payroll processing successful:', data);
      setPayrollData(data.records || []);
      setPayrollProcessed(true);
      
    } catch (error) {
      console.error('💥 Error processing payroll file:', error);
    } finally {
      setIsProcessingPayroll(false);
    }
  };

  const handleTaxFileUpload = async (file: File) => {
    console.log('🚀 Processing tax file:', file.name);
    setIsProcessingTax(true);

    try {
      // Upload to storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${crypto.randomUUID()}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tax-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Tax file upload failed: ${uploadError.message}`);
      }

      // Step 1: Process with Document AI (just like invoice processing)
      const base64Content = await convertFileToBase64(file);
      const extractedText = await processDocumentWithAI(base64Content, file.type);
      
      // Step 2: Process with tax-gemini (just like invoice processing)
      const { data, error } = await supabase.functions.invoke('tax-gemini', {
        body: {
          extractedText: extractedText,
          organization: 'auto'
        }
      });

      if (error) {
        throw new Error(`Tax processing failed: ${error.message}`);
      }

      console.log('✅ Tax processing successful:', data);
      
      // Combine data
      const combinedData: ExtractedData = {
        records: payrollData.map(record => ({
          ...record,
          jarulek: data.amount / payrollData.length // Distribute tax equally
        })),
        totalPayroll: payrollData.reduce((sum, record) => sum + record.amount, 0),
        totalTax: data.amount
      };
      
      setFinalData(combinedData);
      setShowTaxModal(false);
      
    } catch (error) {
      console.error('💥 Error processing tax file:', error);
    } finally {
      setIsProcessingTax(false);
    }
  };

  const handleConfirmPayroll = () => {
    setShowTaxModal(true);
  };

  const handleSave = async () => {
    if (!finalData) return;

    try {
      // Get user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save payroll records
      for (const record of finalData.records) {
        await supabase.from('payroll_records').insert({
          employee_name: record.employeeName,
          project_code: record.projectCode,
          amount: record.amount,
          record_date: record.date,
          is_rental: record.isRental,
          organization: 'auto',
          uploaded_by: user.id
        });
      }

      // Save summary
      const currentDate = new Date();
      await supabase.from('payroll_summaries').insert({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
        total_payroll: finalData.totalPayroll + finalData.totalTax,
        rental_costs: finalData.records.filter(r => r.isRental).reduce((sum, r) => sum + r.amount, 0),
        non_rental_costs: finalData.records.filter(r => !r.isRental).reduce((sum, r) => sum + r.amount, 0),
        tax_amount: finalData.totalTax,
        record_count: finalData.records.length,
        organization: 'auto',
        created_by: user.id
      });

      // Reset state
      setPayrollFile(null);
      setPayrollData([]);
      setFinalData(null);
      setPayrollProcessed(false);
      setShowTaxModal(false);
      
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Bérköltség feldolgozás
        </h2>
        
        {!payrollProcessed ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <label htmlFor="payroll-upload" className="cursor-pointer">
              <div className="text-lg font-medium mb-2">Kattintson ide a bérszámfejtés feltöltéséhez</div>
              <div className="text-gray-600">PDF, JPG, PNG (max. 10MB)</div>
              <input
                id="payroll-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handlePayrollFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Extracted Data Column */}
            <div className="space-y-4">
              <h3 className="font-semibold">Kivont adatok</h3>
              {isProcessingPayroll ? (
                <div className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Feldolgozás...</span>
                </div>
              ) : payrollData.length > 0 ? (
                <div className="space-y-2">
                  <div className="bg-muted p-4 rounded">
                    <h4 className="font-medium mb-2">Dolgozók:</h4>
                    {payrollData.map((record, index) => (
                      <div key={index} className="text-sm border-b pb-1 mb-1">
                        <span className="font-medium">{record.employeeName}</span> - 
                        <span className="text-green-600 font-medium"> {record.amount.toLocaleString()} Ft</span>
                        {record.isRental && <span className="text-orange-500 ml-2">(Kölcsönzött)</span>}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleConfirmPayroll}
                    className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90"
                  >
                    Rendben
                  </button>
                </div>
              ) : (
                <div className="text-gray-500">Nincs feldolgozott adat</div>
              )}
            </div>
            
            {/* Document Preview Column */}
            <div className="space-y-4">
              <h3 className="font-semibold">Dokumentum előnézet</h3>
              {payrollPreviewUrl && (
                <div className="border rounded">
                  {payrollFile?.type === 'application/pdf' ? (
                    <iframe src={payrollPreviewUrl} className="w-full h-96" />
                  ) : (
                    <img src={payrollPreviewUrl} alt="Preview" className="w-full h-96 object-contain" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tax Document Modal */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Járulék dokumentum feltöltése</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <label htmlFor="tax-upload" className="cursor-pointer">
                <div className="font-medium mb-1">Járulék dokumentum feltöltése</div>
                <div className="text-sm text-gray-600">PDF, JPG, PNG (max. 10MB)</div>
                <input
                  id="tax-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleTaxFileUpload(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>
            {isProcessingTax && (
              <div className="mt-4 flex items-center gap-2 justify-center">
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Feldolgozás...</span>
              </div>
            )}
            <button
              onClick={() => setShowTaxModal(false)}
              className="mt-4 w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
            >
              Mégse
            </button>
          </div>
        </div>
      )}

      {/* Final Results */}
      {finalData && (
        <div className="bg-card rounded-lg p-6 border mt-6">
          <h3 className="text-lg font-semibold mb-4">Végső eredmény</h3>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left">Dolgozó</th>
                    <th className="border p-2 text-left">Projektkód</th>
                    <th className="border p-2 text-right">Bér</th>
                    <th className="border p-2 text-right">Járulékok</th>
                    <th className="border p-2 text-left">Típus</th>
                  </tr>
                </thead>
                <tbody>
                  {finalData.records.map((record, index) => (
                    <tr key={index}>
                      <td className="border p-2">{record.employeeName}</td>
                      <td className="border p-2">{record.projectCode}</td>
                      <td className="border p-2 text-right">{record.amount.toLocaleString()} Ft</td>
                      <td className="border p-2 text-right">{record.jarulek?.toLocaleString()} Ft</td>
                      <td className="border p-2">{record.isRental ? 'Kölcsönzött' : 'Alkalmazott'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold">
                    <td className="border p-2" colSpan={2}>Összesen:</td>
                    <td className="border p-2 text-right">{finalData.totalPayroll.toLocaleString()} Ft</td>
                    <td className="border p-2 text-right">{finalData.totalTax.toLocaleString()} Ft</td>
                    <td className="border p-2 text-right font-bold">
                      {(finalData.totalPayroll + finalData.totalTax).toLocaleString()} Ft
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <button
              onClick={handleSave}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Mentés és hozzáadás az előzményekhez
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
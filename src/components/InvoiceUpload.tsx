import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Eye, Edit3, Save, X, FileSpreadsheet, Building2, GraduationCap, Calendar, DollarSign, Hash, User, CreditCard, Banknote, Trash2, Check, Camera, Scan } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { convertFileToBase64, processDocumentWithAI } from '../lib/documentAI';
import { MobileScanner } from './MobileScanner';

interface ProcessedData {
  Szervezet?: string;
  Partner?: string;
  Bankszámlaszám?: string;
  Tárgy?: string;
  'Számla sorszáma'?: string;
  Összeg?: number;
  'Számla kelte'?: string;
  'Fizetési határidő'?: string;
  paymentType?: 'bank_transfer' | 'card_cash_afterpay';
  Munkaszám?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  organization: 'alapitvany' | 'ovoda';
  status: 'uploading' | 'processing' | 'ai_processing' | 'completed' | 'error' | 'cancelled';
  progress: number;
  extractedData?: ProcessedData;
  extractedText?: string;
  error?: string;
  rawAiResponse?: string;
  exportedToSheets?: boolean;
  savedToDatabase?: boolean;
  cancelled?: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const InvoiceUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [editingData, setEditingData] = useState<ProcessedData | null>(null);
  const [exportingToSheets, setExportingToSheets] = useState<string | null>(null);
  const [cancellingFiles, setCancellingFiles] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{fileId: string, field: string} | null>(null);
  const [tempEditValue, setTempEditValue] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // Check if device supports camera
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = { id, type, message };
    setNotifications(prev => [...prev, notification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Helper function to create simple, compatible filename for Supabase Storage
  const createSimpleFilename = (filename: string): string => {
    // Split filename and extension
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    
    // Convert to simple ASCII: remove all special characters and accents
    const simpleName = name
      .toLowerCase()
      .replace(/[áàâäã]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôöõ]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/[ýÿ]/g, 'y')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '_') // Replace any remaining non-alphanumeric with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    return simpleName + extension.toLowerCase();
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    for (const file of validFiles) {
      // Auto-detect organization from filename or default to alapitvany
      const organization: 'alapitvany' | 'ovoda' = 
        file.name.toLowerCase().includes('ovoda') || file.name.toLowerCase().includes('óvoda') 
          ? 'ovoda' 
          : 'alapitvany';

      const newFile: UploadedFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        organization,
        status: 'uploading',
        progress: 0,
        exportedToSheets: false,
        savedToDatabase: false,
        cancelled: false
      };

      setUploadedFiles(prev => [...prev, newFile]);
      await processFile(newFile);
    }
  };

  // Handle scanned PDF from mobile scanner
  const handleScannedPDF = async (pdfBlob: Blob, fileName: string) => {
    setShowScanner(false);
    
    // Convert blob to file
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    // Process as regular file upload
    await handleFiles([file]);
    
    addNotification('success', 'Beolvasott számla sikeresen feltöltve!');
  };

  const cancelFile = async (fileId: string) => {
    setCancellingFiles(prev => new Set(prev).add(fileId));
    
    // Update file status to cancelled
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { 
        ...file, 
        status: 'cancelled' as const,
        cancelled: true,
        error: 'Feldolgozás megszakítva a felhasználó által'
      } : file
    ));

    // Remove from cancelling set after a short delay
    setTimeout(() => {
      setCancellingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }, 1000);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    // Remove from unsaved changes if exists
    setHasUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      // Check if cancelled before each step
      const checkCancelled = () => {
        const currentFile = uploadedFiles.find(f => f.id === uploadedFile.id);
        return currentFile?.cancelled || false;
      };

      // Update status to uploading
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, status: 'uploading', progress: 20 } : file
      ));

      if (checkCancelled()) return;

      // Upload file to Supabase Storage with simple filename
      const simpleFilename = createSimpleFilename(uploadedFile.file.name);
      const fileName = `${uploadedFile.organization}/${Date.now()}_${simpleFilename}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, uploadedFile.file);

      if (uploadError) throw uploadError;

      if (checkCancelled()) return;

      // Update progress
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, progress: 40 } : file
      ));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      if (checkCancelled()) return;

      // Update status to processing
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, status: 'processing', progress: 60 } : file
      ));

      // Convert file to base64 for Document AI
      const base64Content = await convertFileToBase64(uploadedFile.file);
      const mimeType = uploadedFile.file.type;

      if (checkCancelled()) return;

      // Process with Document AI
      const extractedText = await processDocumentWithAI(base64Content, mimeType);

      if (checkCancelled()) return;

      // Update status to AI processing
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, status: 'ai_processing', progress: 80 } : file
      ));

      // Process with Gemini AI
      const geminiResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-with-gemini`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedText: extractedText,
          organization: uploadedFile.organization
        }),
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini feldolgozás sikertelen: ${geminiResponse.statusText}`);
      }

      const geminiResult = await geminiResponse.json();
      
      if (!geminiResult.success) {
        throw new Error(geminiResult.error || 'Gemini feldolgozás sikertelen');
      }

      if (checkCancelled()) return;

      const processedData = geminiResult.data;
      
      // Determine payment type based on presence of bank account
      const paymentType = processedData.Bankszámlaszám ? 'bank_transfer' : 'card_cash_afterpay';
      processedData.paymentType = paymentType;
      processedData.Munkaszám = ''; // Initialize empty work number

      // Automatically save to database
      await saveToDatabase(uploadedFile, processedData, extractedText, publicUrl);

      if (checkCancelled()) return;

      // Update file status to completed
      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { 
          ...file, 
          status: 'completed', 
          progress: 100,
          extractedData: processedData,
          extractedText: extractedText,
          rawAiResponse: geminiResult.rawResponse,
          savedToDatabase: true
        } : file
      ));

    } catch (error) {
      console.error('Error processing file:', error);
      
      // Check if the error is due to cancellation
      const currentFile = uploadedFiles.find(f => f.id === uploadedFile.id);
      if (currentFile?.cancelled) return;

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { 
          ...file, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Ismeretlen hiba'
        } : file
      ));
    }
  };

  const saveToDatabase = async (uploadedFile: UploadedFile, processedData: ProcessedData, extractedText: string, fileUrl: string) => {
    try {
      const { data: invoiceData, error: dbError } = await supabase
        .from('invoices')
        .insert({
          file_name: uploadedFile.file.name,
          file_url: fileUrl,
          organization: uploadedFile.organization,
          status: 'completed',
          extracted_text: extractedText,
          partner: processedData.Partner,
          bank_account: processedData.Bankszámlaszám,
          subject: processedData.Tárgy,
          invoice_number: processedData['Számla sorszáma'],
          amount: processedData.Összeg,
          invoice_date: processedData['Számla kelte'],
          payment_deadline: processedData['Fizetési határidő'],
          payment_method: processedData.paymentType === 'bank_transfer' ? 'Banki átutalás' : 'Kártya/Készpénz/Utánvét',
          invoice_type: processedData.paymentType,
          processed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) throw dbError;
    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleEditData = (file: UploadedFile) => {
    setEditingData({ ...file.extractedData });
    setSelectedFile(file);
  };

  const handleSaveData = async () => {
    if (!selectedFile || !editingData) return;

    try {
      // Update the file with saved data
      setUploadedFiles(prev => prev.map(file => 
        file.id === selectedFile.id ? { 
          ...file, 
          extractedData: editingData
        } : file
      ));

      setSelectedFile(null);
      setEditingData(null);

      addNotification('success', 'Adatok sikeresen frissítve!');

    } catch (error) {
      console.error('Error updating data:', error);
      addNotification('error', 'Hiba történt az adatok frissítése során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    }
  };

  const handleExportToSheets = async (file: UploadedFile) => {
    if (!file.extractedData) return;

    try {
      setExportingToSheets(file.id);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-to-sheets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceData: file.extractedData,
          organization: file.organization
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google Sheets exportálás sikertelen');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Exportálás sikertelen');
      }

      // Mark as exported
      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, exportedToSheets: true } : f
      ));

      addNotification('success', 'Sikeresen exportálva a Google Sheets-be!');

    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      addNotification('error', 'Hiba történt az exportálás során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    } finally {
      setExportingToSheets(null);
    }
  };

  // Inline editing functions
  const startEditing = (fileId: string, field: string, currentValue: any) => {
    setEditingField({ fileId, field });
    setTempEditValue(currentValue?.toString() || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempEditValue('');
  };

  const saveFieldEdit = (fileId: string, field: string) => {
    setUploadedFiles(prev => prev.map(file => {
      if (file.id === fileId && file.extractedData) {
        const updatedData = { ...file.extractedData };
        
        // Handle different field types
        if (field === 'Összeg') {
          updatedData[field] = parseFloat(tempEditValue) || 0;
        } else {
          updatedData[field as keyof ProcessedData] = tempEditValue as any;
        }
        
        return { ...file, extractedData: updatedData };
      }
      return file;
    }));

    // Mark as having unsaved changes
    setHasUnsavedChanges(prev => new Set(prev).add(fileId));
    
    setEditingField(null);
    setTempEditValue('');
  };

  const finalizeChanges = (fileId: string) => {
    // Remove from unsaved changes
    setHasUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
    
    addNotification('success', 'Változások véglegesítve!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader className="h-4 w-4 animate-spin text-blue-600" />;
      case 'processing':
        return <Loader className="h-4 w-4 animate-spin text-yellow-600" />;
      case 'ai_processing':
        return <Loader className="h-4 w-4 animate-spin text-purple-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Feltöltés...';
      case 'processing':
        return 'OCR feldolgozás...';
      case 'ai_processing':
        return 'AI elemzés...';
      case 'completed':
        return 'Kész';
      case 'error':
        return 'Hiba';
      case 'cancelled':
        return 'Megszakítva';
      default:
        return '';
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

  const canCancel = (status: string) => {
    return ['uploading', 'processing', 'ai_processing'].includes(status);
  };

  const canRemove = (status: string) => {
    return ['completed', 'error', 'cancelled'].includes(status);
  };

  // Render editable field
  const renderEditableField = (fileId: string, field: string, value: any, icon: React.ReactNode, label: string, type: 'text' | 'number' | 'date' = 'text', className: string = '') => {
    const isEditing = editingField?.fileId === fileId && editingField?.field === field;
    const displayValue = field === 'Összeg' && value ? formatCurrency(value) : 
                        (field === 'Számla kelte' || field === 'Fizetési határidő') && value ? formatDate(value) : 
                        value || '-';

    return (
      <div className={`bg-gray-50 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:bg-gray-100 cursor-pointer ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          {icon}
          <span className="text-xs sm:text-sm font-medium text-gray-500">{label}</span>
        </div>
        
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type={type}
              value={tempEditValue}
              onChange={(e) => setTempEditValue(e.target.value)}
              className="flex-1 text-xs sm:text-sm font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveFieldEdit(fileId, field);
                } else if (e.key === 'Escape') {
                  cancelEditing();
                }
              }}
            />
            <button
              onClick={() => saveFieldEdit(fileId, field)}
              className="text-green-600 hover:text-green-800 transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelEditing}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p 
            className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
            onClick={() => startEditing(fileId, field, value)}
          >
            {displayValue}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Mobile Scanner Modal */}
      {showScanner && (
        <MobileScanner
          onScanComplete={handleScannedPDF}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
              notification.type === 'success' ? 'border-l-4 border-green-400' :
              notification.type === 'error' ? 'border-l-4 border-red-400' :
              'border-l-4 border-blue-400'
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  {notification.type === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                  {notification.type === 'info' && (
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <span className="sr-only">Bezárás</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Számla feltöltés</h2>
        <p className="text-gray-600 text-sm sm:text-base">Töltse fel a számlákat PDF, JPG vagy PNG formátumban (max. 10MB). Az AI automatikusan kinyeri és elemzi az adatokat.</p>
      </div>

      {/* Upload Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* File Upload Area */}
        <div 
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className={`mx-auto h-10 w-10 sm:h-12 sm:w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="mt-4">
              <p className="text-base sm:text-lg font-medium text-gray-900">
                Fájl feltöltés
              </p>
              <p className="mt-2 text-sm text-gray-500">
                PDF, JPG, PNG támogatott • Max. 10MB
              </p>
            </div>
            <div className="mt-6">
              <label className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors">
                <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Fájlok tallózása
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Mobile Scanner */}
        {isMobile && hasCamera && (
          <div className="relative border-2 border-dashed border-green-300 rounded-xl p-6 sm:p-8 bg-green-50 hover:bg-green-100 transition-colors">
            <div className="text-center">
              <Camera className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
              <div className="mt-4">
                <p className="text-base sm:text-lg font-medium text-gray-900">
                  Mobil beolvasás
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Használja a telefon kameráját számlák beolvasásához
                </p>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setShowScanner(true)}
                  className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Scan className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Beolvasás indítása
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
          {uploadedFiles.map((uploadedFile) => (
            <div key={uploadedFile.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* File Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 gap-2 sm:gap-0">
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                        <div className="flex items-center space-x-2">
                          {uploadedFile.organization === 'alapitvany' ? (
                            <>
                              <Building2 className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-800 font-medium">Alapítvány</span>
                            </>
                          ) : (
                            <>
                              <GraduationCap className="h-4 w-4 text-orange-600" />
                              <span className="text-sm text-orange-800 font-medium">Óvoda</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="text-center sm:text-right">
                      <div className="flex items-center justify-center sm:justify-end space-x-2">
                        {getStatusIcon(uploadedFile.status)}
                        <span className="text-sm font-medium text-gray-900">
                          {getStatusText(uploadedFile.status)}
                        </span>
                      </div>
                      {(uploadedFile.status === 'uploading' || uploadedFile.status === 'processing' || uploadedFile.status === 'ai_processing') && !uploadedFile.cancelled && (
                        <div className="mt-1">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mx-auto sm:mx-0">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadedFile.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {uploadedFile.error && (
                        <p className="text-xs text-red-600 mt-1">{uploadedFile.error}</p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      {/* Cancel Button */}
                      {canCancel(uploadedFile.status) && !uploadedFile.cancelled && (
                        <button
                          onClick={() => cancelFile(uploadedFile.id)}
                          disabled={cancellingFiles.has(uploadedFile.id)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Feldolgozás megszakítása"
                        >
                          {cancellingFiles.has(uploadedFile.id) ? (
                            <Loader className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </button>
                      )}

                      {/* Remove Button */}
                      {canRemove(uploadedFile.status) && (
                        <button
                          onClick={() => removeFile(uploadedFile.id)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                          title="Eltávolítás a listából"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    
                    {/* Status Indicators */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      {uploadedFile.savedToDatabase && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Adatbázisba mentve</span>
                          <span className="sm:hidden">DB</span>
                        </span>
                      )}
                      {uploadedFile.exportedToSheets && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Sheets-be exportálva</span>
                          <span className="sm:hidden">Sheets</span>
                        </span>
                      )}
                      {hasUnsavedChanges.has(uploadedFile.id) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Nem mentett változások</span>
                          <span className="sm:hidden">Változás</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Extracted Data Display */}
              {uploadedFile.status === 'completed' && uploadedFile.extractedData && (
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">Kinyert számla adatok</h4>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={() => setSelectedFile(uploadedFile)}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Nyers szöveg megtekintése</span>
                        <span className="sm:hidden">Nyers szöveg</span>
                      </button>
                      
                      {hasUnsavedChanges.has(uploadedFile.id) && (
                        <button
                          onClick={() => finalizeChanges(uploadedFile.id)}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Változások véglegesítése</span>
                          <span className="sm:hidden">Véglegesítés</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleExportToSheets(uploadedFile)}
                        disabled={exportingToSheets === uploadedFile.id || uploadedFile.exportedToSheets}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {exportingToSheets === uploadedFile.id ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            <span className="hidden sm:inline">Exportálás...</span>
                            <span className="sm:hidden">Export...</span>
                          </>
                        ) : uploadedFile.exportedToSheets ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Exportálva</span>
                            <span className="sm:hidden">Kész</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Google Sheets-be küldés</span>
                            <span className="sm:hidden">Sheets</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Inline Editable Data Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Organization */}
                    {renderEditableField(
                      uploadedFile.id,
                      'Szervezet',
                      uploadedFile.extractedData.Szervezet || (uploadedFile.organization === 'alapitvany' ? 'Alapítvány' : 'Óvoda'),
                      uploadedFile.organization === 'alapitvany' ? 
                        <Building2 className="h-4 w-4 text-blue-600" /> : 
                        <GraduationCap className="h-4 w-4 text-orange-600" />,
                      'Szervezet'
                    )}

                    {/* Partner */}
                    {renderEditableField(
                      uploadedFile.id,
                      'Partner',
                      uploadedFile.extractedData.Partner,
                      <User className="h-4 w-4 text-gray-600" />,
                      'Partner'
                    )}

                    {/* Amount */}
                    {renderEditableField(
                      uploadedFile.id,
                      'Összeg',
                      uploadedFile.extractedData.Összeg,
                      <DollarSign className="h-4 w-4 text-green-600" />,
                      'Összeg',
                      'number'
                    )}

                    {/* Invoice Number */}
                    {renderEditableField(
                      uploadedFile.id,
                      'Számla sorszáma',
                      uploadedFile.extractedData['Számla sorszáma'],
                      <Hash className="h-4 w-4 text-gray-600" />,
                      'Számla sorszáma'
                    )}

                    {/* Invoice Date */}
                    {renderEditableField(
                      uploadedFile.id,
                      'Számla kelte',
                      uploadedFile.extractedData['Számla kelte'],
                      <Calendar className="h-4 w-4 text-blue-600" />,
                      'Számla kelte',
                      'date'
                    )}

                    {/* Payment Type */}
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        {uploadedFile.extractedData.paymentType === 'bank_transfer' ? (
                          <Banknote className="h-4 w-4 text-green-600" />
                        ) : (
                          <CreditCard className="h-4 w-4 text-purple-600" />
                        )}
                        <span className="text-xs sm:text-sm font-medium text-gray-500">Fizetési mód</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">
                        {uploadedFile.extractedData.paymentType === 'bank_transfer' ? 'Banki átutalás' : 'Kártya/Készpénz/Utánvét'}
                      </p>
                    </div>

                    {/* Bank Account (if bank transfer) */}
                    {uploadedFile.extractedData.paymentType === 'bank_transfer' && (
                      <>
                        {renderEditableField(
                          uploadedFile.id,
                          'Bankszámlaszám',
                          uploadedFile.extractedData.Bankszámlaszám,
                          <Banknote className="h-4 w-4 text-green-600" />,
                          'Bankszámlaszám'
                        )}

                        {renderEditableField(
                          uploadedFile.id,
                          'Fizetési határidő',
                          uploadedFile.extractedData['Fizetési határidő'],
                          <Calendar className="h-4 w-4 text-red-600" />,
                          'Fizetési határidő',
                          'date'
                        )}
                      </>
                    )}

                    {/* Subject */}
                    {renderEditableField(
                      uploadedFile.id,
                      'Tárgy',
                      uploadedFile.extractedData.Tárgy,
                      <FileText className="h-4 w-4 text-gray-600" />,
                      'Tárgy',
                      'text',
                      'sm:col-span-2'
                    )}

                    {/* Work Number */}
                    {renderEditableField(
                      uploadedFile.id,
                      'Munkaszám',
                      uploadedFile.extractedData.Munkaszám,
                      <Hash className="h-4 w-4 text-yellow-600" />,
                      'Munkaszám',
                      'text',
                      'border border-yellow-200 bg-yellow-50'
                    )}
                  </div>

                  {/* Click to edit hint */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500 italic">
                      Kattintson bármelyik mezőre a szerkesztéshez. Nyomja meg az Enter-t a mentéshez vagy az Escape-et a megszakításhoz.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Data Verification Modal */}
      {selectedFile && selectedFile.extractedData && !editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Nyers OCR szöveg</h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {selectedFile.extractedText || 'Nincs kinyert szöveg'}
                </pre>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Bezárás
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
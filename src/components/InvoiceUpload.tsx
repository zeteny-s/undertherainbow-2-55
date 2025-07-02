import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Eye, Edit3, Save, X, FileSpreadsheet, Building2, GraduationCap, Calendar, DollarSign, Hash, User, CreditCard, Banknote, Trash2, Check, Play, ArrowLeft, Camera } from 'lucide-react';
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
  organization: 'alapitvany' | 'ovoda' | 'auto'; // Add 'auto' for AI determination
  status: 'preview' | 'uploading' | 'processing' | 'ai_processing' | 'completed' | 'error' | 'cancelled';
  progress: number;
  extractedData?: ProcessedData;
  extractedText?: string;
  error?: string;
  rawAiResponse?: string;
  exportedToSheets?: boolean;
  savedToDatabase?: boolean;
  cancelled?: boolean;
  previewUrl?: string;
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
  const [currentView, setCurrentView] = useState<'upload' | 'preview'>('upload');
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

  const createSimpleFilename = (filename: string): string => {
    const lastDotIndex = filename.lastIndexOf('.');
    const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
    const extension = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
    
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
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
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
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024;
    });

    if (validFiles.length === 0) {
      addNotification('error', 'Kérjük, válasszon érvényes fájlokat (PDF, JPG, PNG, max. 10MB)');
      return;
    }

    for (const file of validFiles) {
      const previewUrl = URL.createObjectURL(file);

      const newFile: UploadedFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        organization: 'auto', // Let AI determine the organization
        status: 'preview',
        progress: 0,
        exportedToSheets: false,
        savedToDatabase: false,
        cancelled: false,
        previewUrl
      };

      setUploadedFiles(prev => [...prev, newFile]);
      setPreviewFile(newFile);
      setCurrentView('preview');
    }
  };

  const handleScanComplete = async (pdfBlob: Blob, fileName: string) => {
    setShowScanner(false);
    
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    await handleFiles([file]);
  };

  const startExtraction = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    setCurrentView('upload');
    await processFile(file);
  };

  const cancelFile = async (fileId: string) => {
    setCancellingFiles(prev => new Set(prev).add(fileId));
    
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { 
        ...file, 
        status: 'cancelled' as const,
        cancelled: true,
        error: 'Feldolgozás megszakítva a felhasználó által'
      } : file
    ));

    setTimeout(() => {
      setCancellingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }, 1000);
  };

  const removeFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file?.previewUrl) {
      URL.revokeObjectURL(file.previewUrl);
    }
    
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    setHasUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });

    if (previewFile?.id === fileId) {
      setPreviewFile(null);
      setCurrentView('upload');
    }
  };

  const goBackToUpload = () => {
    setCurrentView('upload');
    setPreviewFile(null);
  };

  const processFile = async (uploadedFile: UploadedFile) => {
    try {
      const checkCancelled = () => {
        const currentFile = uploadedFiles.find(f => f.id === uploadedFile.id);
        return currentFile?.cancelled || false;
      };

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, status: 'uploading', progress: 20 } : file
      ));

      if (checkCancelled()) return;

      const simpleFilename = createSimpleFilename(uploadedFile.file.name);
      const fileName = `temp/${Date.now()}_${simpleFilename}`; // Use temp folder initially
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, uploadedFile.file);

      if (uploadError) throw uploadError;

      if (checkCancelled()) return;

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, progress: 40 } : file
      ));

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

      if (checkCancelled()) return;

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, status: 'processing', progress: 60 } : file
      ));

      const base64Content = await convertFileToBase64(uploadedFile.file);
      const mimeType = uploadedFile.file.type;

      if (checkCancelled()) return;

      const extractedText = await processDocumentWithAI(base64Content, mimeType);

      if (checkCancelled()) return;

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, status: 'ai_processing', progress: 80 } : file
      ));

      // Don't pass organization to Gemini - let it determine from the document
      const geminiResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-with-gemini`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedText: extractedText
          // Remove organization parameter - let AI determine it
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
      
      // Determine payment type from AI response
      const paymentType = processedData.Bankszámlaszám ? 'bank_transfer' : 'card_cash_afterpay';
      processedData.paymentType = paymentType;
      processedData.Munkaszám = '';

      // Determine the actual organization from AI response and move file to correct folder
      let finalOrganization: 'alapitvany' | 'ovoda' = 'alapitvany'; // default
      
      if (processedData.Szervezet) {
        if (processedData.Szervezet.toLowerCase().includes('óvoda') || 
            processedData.Szervezet.toLowerCase().includes('ovoda')) {
          finalOrganization = 'ovoda';
        } else {
          finalOrganization = 'alapitvany';
        }
      }

      // Move file to correct organization folder
      const finalFileName = `${finalOrganization}/${Date.now()}_${simpleFilename}`;
      
      // Copy file to final location
      const { error: moveError } = await supabase.storage
        .from('invoices')
        .move(fileName, finalFileName);

      if (moveError) {
        console.warn('Failed to move file to organization folder:', moveError);
        // Continue with original file location if move fails
      }

      const finalFileUrl = moveError ? publicUrl : supabase.storage
        .from('invoices')
        .getPublicUrl(finalFileName).data.publicUrl;

      // Save to database with AI-determined organization
      await saveToDatabase(uploadedFile, processedData, extractedText, finalFileUrl, finalOrganization);

      if (checkCancelled()) return;

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { 
          ...file, 
          status: 'completed', 
          progress: 100,
          organization: finalOrganization, // Update with AI-determined organization
          extractedData: processedData,
          extractedText: extractedText,
          rawAiResponse: geminiResult.rawResponse,
          savedToDatabase: true
        } : file
      ));

      addNotification('success', 'Számla sikeresen feldolgozva és mentve!');

    } catch (error) {
      console.error('Error processing file:', error);
      
      const currentFile = uploadedFiles.find(f => f.id === uploadedFile.id);
      if (currentFile?.cancelled) return;

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { 
          ...file, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Ismeretlen hiba'
        } : file
      ));

      addNotification('error', 'Hiba történt a feldolgozás során: ' + (error instanceof Error ? error.message : 'Ismeretlen hiba'));
    }
  };

  const saveToDatabase = async (uploadedFile: UploadedFile, processedData: ProcessedData, extractedText: string, fileUrl: string, organization: 'alapitvany' | 'ovoda') => {
    try {
      const { data: invoiceData, error: dbError } = await supabase
        .from('invoices')
        .insert({
          file_name: uploadedFile.file.name,
          file_url: fileUrl,
          organization: organization, // Use AI-determined organization
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
        
        if (field === 'Összeg') {
          updatedData[field] = parseFloat(tempEditValue) || 0;
        } else {
          updatedData[field as keyof ProcessedData] = tempEditValue as any;
        }
        
        return { ...file, extractedData: updatedData };
      }
      return file;
    }));

    setHasUnsavedChanges(prev => new Set(prev).add(fileId));
    
    setEditingField(null);
    setTempEditValue('');
  };

  const finalizeChanges = (fileId: string) => {
    setHasUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
    
    addNotification('success', 'Változások véglegesítve!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'preview':
        return <Eye className="h-4 w-4 text-blue-600" />;
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
      case 'preview':
        return 'Előnézet';
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
    return ['preview', 'completed', 'error', 'cancelled'].includes(status);
  };

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
            className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors break-words"
            onClick={() => startEditing(fileId, field, value)}
          >
            {displayValue}
          </p>
        )}
      </div>
    );
  };

  const renderPreviewView = () => {
    if (!previewFile) return null;

    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={goBackToUpload}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Számla előnézet</h2>
                <p className="text-gray-600 text-sm sm:text-base">Ellenőrizze a számlát, majd indítsa el a feldolgozást</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">AI fogja meghatározni a szervezetet</span>
              </div>
              
              <button
                onClick={() => startExtraction(previewFile.id)}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                Feldolgozás indítása
              </button>
            </div>
          </div>
        </div>

        {/* File Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{previewFile.file.name}</h3>
              <p className="text-sm text-gray-500">
                {(previewFile.file.size / 1024 / 1024).toFixed(1)} MB • {previewFile.file.type}
              </p>
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900">Dokumentum előnézet</h4>
          </div>
          
          <div className="p-3 sm:p-4">
            {previewFile.file.type === 'application/pdf' ? (
              <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={previewFile.previewUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <img
                  src={previewFile.previewUrl}
                  alt="Invoice preview"
                  className="max-w-full h-auto max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] border border-gray-200 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUploadView = () => (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Számla feltöltés</h2>
        <p className="text-gray-600 text-sm sm:text-base">Töltse fel a számlákat PDF, JPG vagy PNG formátumban (max. 10MB). Az AI automatikusan kinyeri és elemzi az adatokat, valamint meghatározza a szervezetet.</p>
      </div>

      {/* File Upload Area */}
      <div 
        className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 lg:p-8 transition-colors mb-6 sm:mb-8 ${
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
          <Upload className={`mx-auto h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <div className="mt-3 sm:mt-4">
            <p className="text-base sm:text-lg font-medium text-gray-900">
              Húzza ide a fájlokat vagy kattintson a tallózáshoz
            </p>
            <p className="mt-1 sm:mt-2 text-sm text-gray-500">
              PDF, JPG, PNG támogatott • Max. 10MB • AI automatikusan meghatározza a szervezetet
            </p>
          </div>
          <div className="mt-4 sm:mt-6 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <label className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-lg shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors">
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
            
            {/* Mobile Scanner Button */}
            {isMobile && (
              <button
                onClick={() => setShowScanner(true)}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Dokumentum beolvasása
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {uploadedFiles.map((uploadedFile) => (
            <div key={uploadedFile.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* File Header */}
              <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 space-y-1 sm:space-y-0">
                        <p className="text-xs sm:text-sm text-gray-500">
                          {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                        <div className="flex items-center space-x-2">
                          {uploadedFile.organization === 'auto' ? (
                            <>
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                              <span className="text-xs sm:text-sm text-purple-800 font-medium">AI meghatározza</span>
                            </>
                          ) : uploadedFile.organization === 'alapitvany' ? (
                            <>
                              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                              <span className="text-xs sm:text-sm text-blue-800 font-medium">Alapítvány</span>
                            </>
                          ) : (
                            <>
                              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                              <span className="text-xs sm:text-sm text-orange-800 font-medium">Óvoda</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 ml-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(uploadedFile.status)}
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {getStatusText(uploadedFile.status)}
                        </span>
                      </div>
                      {(uploadedFile.status === 'uploading' || uploadedFile.status === 'processing' || uploadedFile.status === 'ai_processing') && !uploadedFile.cancelled && (
                        <div className="mt-1">
                          <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadedFile.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {uploadedFile.error && (
                        <p className="text-xs text-red-600 mt-1 max-w-xs break-words">{uploadedFile.error}</p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Start Extraction Button for Preview */}
                      {uploadedFile.status === 'preview' && (
                        <button
                          onClick={() => startExtraction(uploadedFile.id)}
                          className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Indítás
                        </button>
                      )}

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
                    <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
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
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900">Kinyert számla adatok</h4>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        onClick={() => setSelectedFile(uploadedFile)}
                        className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Nyers szöveg megtekintése</span>
                        <span className="sm:hidden">Nyers szöveg</span>
                      </button>
                      
                      {hasUnsavedChanges.has(uploadedFile.id) && (
                        <button
                          onClick={() => finalizeChanges(uploadedFile.id)}
                          className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Változások véglegesítése</span>
                          <span className="sm:hidden">Véglegesítés</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleExportToSheets(uploadedFile)}
                        disabled={exportingToSheets === uploadedFile.id || uploadedFile.exportedToSheets}
                        className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {/* Organization - Show AI-determined value */}
                    {renderEditableField(
                      uploadedFile.id,
                      'Szervezet',
                      uploadedFile.extractedData.Szervezet,
                      uploadedFile.extractedData.Szervezet?.toLowerCase().includes('óvoda') ? 
                        <GraduationCap className="h-4 w-4 text-orange-600" /> : 
                        <Building2 className="h-4 w-4 text-blue-600" />,
                      'Szervezet (AI által meghatározott)'
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
                  <div className="mt-3 sm:mt-4 text-center">
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
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
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

  return (
    <div className="min-h-screen bg-gray-50">
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
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                  )}
                  {notification.type === 'info' && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
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

      {/* Mobile Scanner Modal */}
      {showScanner && (
        <MobileScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Render current view */}
      {currentView === 'preview' ? renderPreviewView() : renderUploadView()}
    </div>
  );
};
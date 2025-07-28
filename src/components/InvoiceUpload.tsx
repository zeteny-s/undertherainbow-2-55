import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, Eye, X, FileSpreadsheet, Building2, GraduationCap, Calendar, DollarSign, Hash, User, CreditCard, Banknote, Trash2, Check, Play, Camera, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { convertFileToBase64, processDocumentWithAI } from '../lib/documentAI';
import { MobileScanner } from './MobileScanner';
import { SUPABASE_CONFIG } from '../config/supabase';

interface ProcessedData {
  Szervezet?: string;
  Partner?: string;
  Bankszámlaszám?: string;
  Tárgy?: string;
  'Számla sorszáma'?: string;
  Összeg?: number | string;
  'Számla kelte'?: string;
  'Fizetési határidő'?: string;
  paymentType?: 'bank_transfer' | 'card_cash_afterpay';
  specificPaymentMethod?: string; // Specific payment method for non-bank transfer payments
  Munkaszám?: string;
  category?: string; // Invoice category classification
}

interface UploadedFile {
  file: File;
  id: string;
  organization: 'alapitvany' | 'ovoda' | 'auto';
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
  isHidden?: boolean; // Flag to track if a file should be hidden after export animation
  isExiting?: boolean; // Flag for animation state
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const InvoiceUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [exportingToSheets, setExportingToSheets] = useState<string | null>(null);
  const [cancellingFiles, setCancellingFiles] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{fileId: string, field: string} | null>(null);
  const [tempEditValue, setTempEditValue] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Process the next file in queue when current file finishes
  useEffect(() => {
    const processNextInQueue = async () => {
      if (processingQueue.length > 0 && !currentlyProcessing) {
        const nextFileId = processingQueue[0];
        const nextFile = uploadedFiles.find(f => f.id === nextFileId);
        
        if (nextFile) {
          setCurrentlyProcessing(nextFileId);
          
          // Remove from queue
          setProcessingQueue(prev => prev.filter(id => id !== nextFileId));
          
          // Process the file
          await processFile(nextFile);
          
          // Clear current processing
          setCurrentlyProcessing(null);
        }
      }
    };
    
    processNextInQueue();
  }, [processingQueue, currentlyProcessing, uploadedFiles]);

  // Helper function to update munkaszam in database
  const updateMunkaszamInDatabase = async (fileId: string, fileName: string, organization: 'alapitvany' | 'ovoda' | 'auto', newMunkaszam: string) => {
    try {
      const { data: existingInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('id')
        .eq('file_name', fileName)
        .eq('organization', organization)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fetchError || !existingInvoices || existingInvoices.length === 0) {
        console.error('Could not find invoice for auto-save', fetchError);
        return;
      }
      
      const invoiceId = existingInvoices[0].id;
      
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          munkaszam: newMunkaszam,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);
      
      if (updateError) {
        console.error('Error saving munkaszam:', updateError);
        return;
      }
      
      // Show saved indicator
      const savedIndicator = document.getElementById(`munkaszam-saved-${fileId}`);
      if (savedIndicator) {
        savedIndicator.style.opacity = '1';
        setTimeout(() => {
          savedIndicator.style.opacity = '0';
        }, 2000);
      }
    } catch (error) {
      console.error('Error in save munkaszam:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdowns.size > 0) {
        const clickedOnDropdown = Array.from(openDropdowns).some(dropdownId => {
          const dropdown = document.getElementById(dropdownId);
          const button = document.getElementById(`${dropdownId}-button`);
          return dropdown && (dropdown.contains(event.target as Node) || button?.contains(event.target as Node));
        });
        
        if (!clickedOnDropdown) {
          setOpenDropdowns(new Set());
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdowns]);

  const parseHungarianCurrency = (value: string | number | undefined): number => {
    if (typeof value === 'number') return value;
    if (!value || typeof value !== 'string') return 0;
    
    // Remove currency symbols and normalize the string
    const cleanValue = value
      .replace(/HUF|Ft|€|EUR|\$|USD/gi, '') // Remove currency symbols
      .replace(/\s+/g, '') // Remove all spaces (thousands separators)
      .replace(',', '.') // Replace comma with dot for decimal point
      .trim();
    
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

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

    const newFileIds: string[] = [];

    for (const file of validFiles) {
      const previewUrl = URL.createObjectURL(file);
      const newId = Math.random().toString(36).substr(2, 9);

      const newFile: UploadedFile = {
        file,
        id: newId,
        organization: 'auto',
        status: 'preview',
        progress: 0,
        exportedToSheets: false,
        savedToDatabase: false,
        cancelled: false,
        previewUrl
      };

      newFileIds.push(newId);
      setUploadedFiles(prev => [...prev, newFile]);
    }
    
    // If no file is currently being processed, add to processing queue
    if (!currentlyProcessing) {
      setProcessingQueue(prev => [...prev, ...newFileIds]);
    } else {
      // Otherwise add to queue
      setProcessingQueue(prev => [...prev, ...newFileIds]);
      addNotification('info', `${newFileIds.length} számla hozzáadva a feldolgozási sorhoz`);
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

    if (currentlyProcessing) {
      // Add to queue if another file is processing
      setProcessingQueue(prev => [...prev, fileId]);
      addNotification('info', 'Számla hozzáadva a feldolgozási sorhoz');
    } else {
      // Start processing immediately if no file is being processed
      setCurrentlyProcessing(fileId);
      await processFile(file);
      setCurrentlyProcessing(null);
    }
  };

  const cancelFile = async (fileId: string) => {
    setCancellingFiles(prev => new Set(prev).add(fileId));
    
    // Remove from processing queue if it's there
    setProcessingQueue(prev => prev.filter(id => id !== fileId));
    
    // Mark as cancelled
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
    
    // Remove from queue if it's there
    setProcessingQueue(prev => prev.filter(id => id !== fileId));
    
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    setHasUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  // Animate and hide file after export
  const hideFileAfterExport = (fileId: string) => {
    // First set the exiting flag to trigger animation
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, isExiting: true } : file
    ));
    
    // After animation completes, set isHidden flag
    setTimeout(() => {
      setUploadedFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, isHidden: true } : file
      ));
    }, 500);
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
      const tempFileName = `temp/${Date.now()}_${simpleFilename}`;
      
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(tempFileName, uploadedFile.file);

      if (uploadError) throw uploadError;

      if (checkCancelled()) return;

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { ...file, progress: 40 } : file
      ));

      const { data: { publicUrl: tempPublicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(tempFileName);

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

      const geminiResponse = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/process-with-gemini`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedText: extractedText
        }),
      });

      if (!geminiResponse.ok) {
        // Check if the response is JSON or HTML
        const contentType = geminiResponse.headers.get('content-type');
        let errorMessage = `Gemini feldolgozás sikertelen: ${geminiResponse.statusText}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await geminiResponse.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use the default error message
          }
        } else if (contentType && contentType.includes('text/html')) {
          errorMessage = `A Supabase funkcióhívás HTML hibát adott vissza (státusz: ${geminiResponse.status}). Ez általában autentikációs vagy konfigurációs problémát jelez.`;
        }
        
        throw new Error(errorMessage);
      }

      // Check if response is JSON before parsing
      const contentType = geminiResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await geminiResponse.text();
        console.error('Unexpected response type from Gemini function:', contentType, 'Response:', responseText);
        throw new Error(`A Gemini funkcióhívás váratlan tartalmat adott vissza: ${contentType || 'ismeretlen'}`);
      }

      const geminiResult = await geminiResponse.json();
      
      if (!geminiResult.success) {
        throw new Error(geminiResult.error || 'Gemini feldolgozás sikertelen');
      }

      if (checkCancelled()) return;

      const processedData = geminiResult.data;
      
      // Log the full Gemini response for debugging
      console.log('Full Gemini result:', geminiResult);
      
      // Check if the Gemini result already contains a category field
      if (geminiResult.data && typeof geminiResult.data === 'object') {
        // Check for category with different possible field names
        const categoryFields = ['category', 'Category', 'kategória', 'Kategória'];
        for (const field of categoryFields) {
          if (geminiResult.data[field]) {
            console.log(`Category found in geminiResult.data.${field}:`, geminiResult.data[field]);
            // Store the category in the processed data
            processedData.category = geminiResult.data[field];
            break;
          }
        }
      }
      
      // Extract payment type information from the raw response
      let specificPaymentMethod = '';
      const rawResponse = geminiResult.rawResponse || '';
      
      // Check for payment method in the raw response
      if (rawResponse && typeof rawResponse === 'string') {
        console.log('Raw Gemini response:', rawResponse);
        
        // Check for bank card indicators with broader regex
        if (rawResponse.match(/bank\s*k[aáä]rty[aáä]/i) || 
            rawResponse.match(/credit card/i) || 
            rawResponse.match(/"Bank Kártya"/i)) {
          specificPaymentMethod = 'Bankkártya';
        } 
        // Check for cash indicators
        else if (rawResponse.match(/k[eé]szp[eé]nz/i) || rawResponse.match(/cash/i)) {
          specificPaymentMethod = 'Készpénz';
        }
        // Check for cash on delivery
        else if (rawResponse.match(/ut[aá]nv[eé]t/i) || rawResponse.match(/cash on delivery/i)) {
          specificPaymentMethod = 'Utánvét';
        }
        // Check for online payment
        else if (rawResponse.match(/online/i)) {
          specificPaymentMethod = 'Online fizetés';
        }
      }
      
      console.log('Detected payment method:', specificPaymentMethod);
      
      // Determine payment type
      const paymentType = processedData.Bankszámlaszám ? 'bank_transfer' : 'card_cash_afterpay';
      processedData.paymentType = paymentType;
      
      // Use detected specificPaymentMethod, but ensure it's properly normalized
      if (specificPaymentMethod) {
        processedData.specificPaymentMethod = specificPaymentMethod;
      } else if (paymentType !== 'bank_transfer') {
        // Set a generic value if we couldn't detect a specific non-bank payment method
        processedData.specificPaymentMethod = 'Egyéb fizetési mód';
      }
      
      processedData.Munkaszám = '';
      
      // Determine invoice category based on the Gemini response
      let category = '';
      
      // First check if the category is directly available in the processedData
      if (processedData.category) {
        category = processedData.category;
        console.log('Category found directly in processedData:', category);
      } else {
        // Try to parse the category from the raw JSON in the response
        try {
          // Look for JSON in the raw response
          const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
            // Check various possible field names for category
            const categoryFields = ['category', 'Category', 'kategória', 'Kategória'];
            for (const field of categoryFields) {
              if (jsonData[field]) {
                category = jsonData[field];
                console.log(`Category found in raw JSON response (${field}):`, category);
                break;
              }
            }
          }
        } catch (error) {
          console.error('Error extracting category from raw JSON:', error);
        }
      }
      
      // Extract category from the Gemini API response
      if (rawResponse && typeof rawResponse === 'string') {
        console.log('Checking for category in raw response');
        
        // First, try to find exact category mentions with quotes
        const categoryPatterns = [
          /kategória:\s*"([^"]+)"/i,
          /category:\s*"([^"]+)"/i,
          /"kategória":\s*"([^"]+)"/i,
          /"category":\s*"([^"]+)"/i,
          /kategória:\s*(\S+)/i,
          /category:\s*(\S+)/i
        ];
        
        // Try each pattern
        for (const pattern of categoryPatterns) {
          const match = rawResponse.match(pattern);
          if (match && match[1]) {
            category = match[1].trim();
            console.log('Found category in raw response using pattern:', category);
            break;
          }
        }
        
        // If no match found with patterns, try to extract from the JSON structure
        if (!category) {
          try {
            // Look for JSON in the response
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonData = JSON.parse(jsonMatch[0]);
              // Check for category field with various possible names
              if (jsonData.category) {
                category = jsonData.category;
                console.log('Found category in JSON (category field):', category);
              } else if (jsonData.Category) {
                category = jsonData.Category;
                console.log('Found category in JSON (Category field):', category);
              } else if (jsonData.kategória) {
                category = jsonData.kategória;
                console.log('Found category in JSON (kategória field):', category);
              } else if (jsonData.Kategória) {
                category = jsonData.Kategória;
                console.log('Found category in JSON (Kategória field):', category);
              }
            }
          } catch (error) {
            console.error('Error parsing JSON from raw response:', error);
          }
        }
        
        // If still no category found, try to find it in the text using more general patterns
        if (!category) {
          const validCategories = [
            'Bérleti díjak',
            'Közüzemi díjak',
            'Szolgáltatások',
            'Étkeztetés költségei',
            'Személyi jellegű kifizetések',
            'Anyagköltség',
            'Tárgyi eszközök',
            'Felújítás, beruházások',
            'Egyéb'
          ];
          
          for (const validCategory of validCategories) {
            if (rawResponse.includes(validCategory)) {
              category = validCategory;
              console.log('Found category by direct text match:', category);
              break;
            }
          }
        }
      }
      
      // Validate and normalize category
      const validCategories = [
        'Bérleti díjak',
        'Közüzemi díjak',
        'Szolgáltatások',
        'Étkeztetés költségei',
        'Személyi jellegű kifizetések',
        'Anyagköltség',
        'Tárgyi eszközök',
        'Felújítás, beruházások',
        'Egyéb'
      ];
      
      // If category is not valid, set to 'Egyéb'
      if (!category || !validCategories.includes(category)) {
        console.log('Category not valid or not found, defaulting to Egyéb');
        category = 'Egyéb';
      } else {
        console.log('Final validated category:', category);
      }
      
      // Set the category in the processed data
      processedData.category = category;
      
      // Parse the amount to ensure it's a valid number
      processedData.Összeg = parseHungarianCurrency(processedData.Összeg);

      let finalOrganization: 'alapitvany' | 'ovoda' = 'alapitvany';
      
      if (processedData.Szervezet) {
        if (processedData.Szervezet.toLowerCase().includes('óvoda') || 
            processedData.Szervezet.toLowerCase().includes('ovoda')) {
          finalOrganization = 'ovoda';
        } else {
          finalOrganization = 'alapitvany';
        }
      }

      // Create final file path with organization folder
      const finalFileName = `${finalOrganization}/${Date.now()}_${simpleFilename}`;
      
      console.log('Moving file from:', tempFileName, 'to:', finalFileName);
      
      // Move file to organization-specific folder
      const { error: moveError } = await supabase.storage
        .from('invoices')
        .move(tempFileName, finalFileName);

      if (moveError) {
        console.error('Failed to move file to organization folder:', moveError);
        // If move fails, try to get the temp file URL and continue
        addNotification('error', `Fájl áthelyezése sikertelen: ${moveError.message}`);
      }

      // Get the final file URL (use moved file if successful, temp file if move failed)
      const finalFileUrl = moveError ? tempPublicUrl : supabase.storage
        .from('invoices')
        .getPublicUrl(finalFileName).data.publicUrl;

      console.log('Final file URL:', finalFileUrl);

      await saveToDatabase(uploadedFile, processedData, extractedText, finalFileUrl, finalOrganization);

      if (checkCancelled()) return;

      // Log the final category before updating UI
      console.log('Final category being set in UI:', processedData.category);

      setUploadedFiles(prev => prev.map(file => 
        file.id === uploadedFile.id ? { 
          ...file, 
          status: 'completed', 
          progress: 100,
          organization: finalOrganization,
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
      // Determine payment method display text
      let displayPaymentMethod = '';
      if (processedData.paymentType === 'bank_transfer') {
        displayPaymentMethod = 'Banki átutalás';
      } else if (processedData.specificPaymentMethod) {
        // Use the specific payment method detected by AI
        displayPaymentMethod = processedData.specificPaymentMethod;
      } else {
        // Fallback for non-bank payments without specific type detected
        displayPaymentMethod = 'Kártya/Készpénz/Utánvét';
      }
      
      const { error: dbError } = await supabase
        .from('invoices')
        .insert({
          file_name: uploadedFile.file.name,
          file_url: fileUrl,
          organization: organization,
          status: 'completed',
          extracted_text: extractedText,
          partner: processedData.Partner,
          bank_account: processedData.Bankszámlaszám,
          subject: processedData.Tárgy,
          invoice_number: processedData['Számla sorszáma'],
          amount: typeof processedData.Összeg === 'number' ? processedData.Összeg : (processedData.Összeg ? parseFloat(processedData.Összeg.toString()) : null),
          invoice_date: processedData['Számla kelte'],
          payment_deadline: processedData['Fizetési határidő'],
          payment_method: displayPaymentMethod,
          invoice_type: processedData.paymentType,
          munkaszam: processedData.Munkaszám || '',
          category: processedData.category || 'Egyéb',
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

  const handleExportToSheets = async (file: UploadedFile) => {
    if (!file.extractedData) return;

    try {
      setExportingToSheets(file.id);

      const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/export-to-sheets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceData: file.extractedData,
          organization: file.organization
        }),
      });

      if (!response.ok) {
        // Check if the response is JSON or HTML
        const contentType = response.headers.get('content-type');
        let errorMessage = `Google Sheets exportálás sikertelen: ${response.statusText}`;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If JSON parsing fails, use the default error message
          }
        } else if (contentType && contentType.includes('text/html')) {
          errorMessage = `A Supabase funkcióhívás HTML hibát adott vissza (státusz: ${response.status}). Ez általában autentikációs vagy konfigurációs problémát jelez.`;
        }
        
        throw new Error(errorMessage);
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Unexpected response type from export function:', contentType, 'Response:', responseText);
        throw new Error(`Az exportálási funkcióhívás váratlan tartalmat adott vissza: ${contentType || 'ismeretlen'}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Exportálás sikertelen');
      }

      setUploadedFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, exportedToSheets: true } : f
      ));

      addNotification('success', 'Sikeresen exportálva a Google Sheets-be!');
      
      // Start the animation to hide the file
      hideFileAfterExport(file.id);

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
          updatedData[field] = parseHungarianCurrency(tempEditValue);
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
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file || !file.extractedData) {
      addNotification('error', 'Nem található a fájl vagy az adatok');
      return;
    }

    // Update the database with the new extracted data
    // Note: Munkaszám and category are already auto-saved
    updateInvoiceInDatabase(file);
    
    setHasUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
    
    addNotification('success', 'Változások véglegesítve!');
  };

  const updateInvoiceInDatabase = async (uploadedFile: UploadedFile) => {
    if (!uploadedFile.extractedData) return;

    try {
      // Find the invoice in the database by matching file name and organization
      const { data: existingInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('id')
        .eq('file_name', uploadedFile.file.name)
        .eq('organization', uploadedFile.organization)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching invoice for update:', fetchError);
        addNotification('error', 'Hiba történt a számla keresése során');
        return;
      }

      if (!existingInvoices || existingInvoices.length === 0) {
        addNotification('error', 'Nem található a számla az adatbázisban');
        return;
      }

      const invoiceId = existingInvoices[0].id;
      
      // Determine payment method display text
      let displayPaymentMethod = '';
      if (uploadedFile.extractedData.paymentType === 'bank_transfer') {
        displayPaymentMethod = 'Banki átutalás';
      } else if (uploadedFile.extractedData.specificPaymentMethod) {
        // Use the specific payment method detected by AI
        displayPaymentMethod = uploadedFile.extractedData.specificPaymentMethod;
      } else {
        // Fallback for non-bank payments without specific type detected
        displayPaymentMethod = 'Kártya/Készpénz/Utánvét';
      }

      // Update the invoice with the new data
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          partner: uploadedFile.extractedData.Partner,
          bank_account: uploadedFile.extractedData.Bankszámlaszám,
          subject: uploadedFile.extractedData.Tárgy,
          invoice_number: uploadedFile.extractedData['Számla sorszáma'],
          amount: typeof uploadedFile.extractedData.Összeg === 'number' ? uploadedFile.extractedData.Összeg : (uploadedFile.extractedData.Összeg ? parseFloat(uploadedFile.extractedData.Összeg.toString()) : null),
          invoice_date: uploadedFile.extractedData['Számla kelte'],
          payment_deadline: uploadedFile.extractedData['Fizetési határidő'],
          payment_method: displayPaymentMethod,
          invoice_type: uploadedFile.extractedData.paymentType,
          munkaszam: uploadedFile.extractedData.Munkaszám || '',
          category: uploadedFile.extractedData.category || 'Egyéb',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error('Error updating invoice:', updateError);
        addNotification('error', 'Hiba történt a számla frissítése során');
        return;
      }

      console.log('Invoice updated successfully in database');
      addNotification('success', 'Számla adatok sikeresen frissítve az adatbázisban!');

    } catch (error) {
      console.error('Error in updateInvoiceInDatabase:', error);
      addNotification('error', 'Váratlan hiba történt a frissítés során');
    }
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

  const renderDocumentPreview = (file: UploadedFile) => {
    // Check if we're on mobile - this function shouldn't even render on mobile
    if (!file.previewUrl || (typeof window !== 'undefined' && window.innerWidth < 640)) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
        <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Dokumentum előnézet
            </h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewZoom(Math.max(0.5, previewZoom - 0.25))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                title="Kicsinyítés"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                onClick={() => setPreviewZoom(Math.min(3, previewZoom + 0.25))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                title="Nagyítás"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPreviewRotation((previewRotation + 90) % 360)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                title="Forgatás"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <div className="w-full h-full overflow-auto flex items-center justify-center p-2">
            {file.file.type === 'application/pdf' ? (
              <div className="w-full h-full flex items-center justify-center bg-white">
                <iframe
                  src={file.previewUrl}
                  className="border-0 rounded-lg shadow-sm max-w-full max-h-full"
                  style={{
                    width: '90%',
                    height: '90%',
                    transform: `rotate(${previewRotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease'
                  }}
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={file.previewUrl}
                  alt="Invoice preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                  style={{
                    transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s ease',
                    maxWidth: 'none',
                    maxHeight: 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Queue status display
  const renderQueueStatus = () => {
    if (processingQueue.length === 0 && !currentlyProcessing) return null;
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <Loader className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 animate-spin" />
            <h4 className="text-sm sm:text-base font-semibold text-gray-900">Feldolgozási sor</h4>
          </div>
          <div className="text-sm text-gray-600">
            {currentlyProcessing && (
              <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                Feldolgozás alatt: 1
              </span>
            )}
            {processingQueue.length > 0 && (
              <span className="inline-flex items-center bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium ml-2">
                Sorban: {processingQueue.length}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

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

    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Számla feltöltés</h2>
        <p className="text-gray-600 text-sm sm:text-base">Töltse fel a számlákat PDF, JPG vagy PNG formátumban (max. 10MB). Az AI automatikusan kinyeri és elemzi az adatokat, valamint meghatározza a szervezetet.</p>
      </div>

      {/* Queue status display */}
      {renderQueueStatus()}

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
          {uploadedFiles.filter(file => !file.isHidden).map((uploadedFile) => (
            <div 
              key={uploadedFile.id} 
              className={`grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 transition-all duration-500 ease-in-out ${
                uploadedFile.isExiting ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
              }`}
            >
              {/* Left Column: Document Preview (Hidden on mobile, visible on desktop) */}
              <div className="hidden sm:block order-2 xl:order-1 h-[60vh] sm:h-[65vh] lg:h-[70vh] xl:h-[800px]">
                {renderDocumentPreview(uploadedFile)}
              </div>

              {/* Right Column: Processing Status and Data */}
              <div className="order-1 xl:order-2 space-y-4 sm:space-y-6">
                {/* File Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
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
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900">Kinyert számla adatok</h4>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
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
                          {uploadedFile.extractedData.paymentType === 'bank_transfer' ? 
                            'Banki átutalás' : 
                            (uploadedFile.extractedData.specificPaymentMethod || 'Kártya/Készpénz/Utánvét')
                          }
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

                      {/* Category Selection */}
                      <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-xs sm:text-sm font-medium text-gray-500">Kategória</span>
                          </div>
                          <span className="text-xs text-green-600 opacity-0 transition-opacity duration-300" id={`category-saved-${uploadedFile.id}`}>
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Mentve
                          </span>
                        </div>
                        <select
                          value={uploadedFile.extractedData.category || 'Egyéb'}
                          onChange={(e) => {
                            const newCategory = e.target.value;
                            
                            // Update local state
                            setUploadedFiles(prev => prev.map(file => {
                              if (file.id === uploadedFile.id && file.extractedData) {
                                return {
                                  ...file,
                                  extractedData: {
                                    ...file.extractedData,
                                    category: newCategory
                                  }
                                };
                              }
                              return file;
                            }));
                            
                            // Auto-save the category change
                            const saveCategory = async () => {
                              try {
                                // Find the invoice in the database
                                const { data: existingInvoices, error: fetchError } = await supabase
                                  .from('invoices')
                                  .select('id')
                                  .eq('file_name', uploadedFile.file.name)
                                  .eq('organization', uploadedFile.organization)
                                  .order('created_at', { ascending: false })
                                  .limit(1);
                                
                                if (fetchError || !existingInvoices || existingInvoices.length === 0) {
                                  console.error('Could not find invoice for auto-save', fetchError);
                                  return;
                                }
                                
                                const invoiceId = existingInvoices[0].id;
                                
                                // Update just the category field
                                const { error: updateError } = await supabase
                                  .from('invoices')
                                  .update({
                                    category: newCategory,
                                    updated_at: new Date().toISOString()
                                  })
                                  .eq('id', invoiceId);
                                
                                if (updateError) {
                                  console.error('Error auto-saving category:', updateError);
                                  return;
                                }
                                
                                // Show saved indicator
                                const savedIndicator = document.getElementById(`category-saved-${uploadedFile.id}`);
                                if (savedIndicator) {
                                  savedIndicator.style.opacity = '1';
                                  setTimeout(() => {
                                    savedIndicator.style.opacity = '0';
                                  }, 2000);
                                }
                              } catch (error) {
                                console.error('Error in auto-save category:', error);
                              }
                            };
                            
                            saveCategory();
                          }}
                          className="w-full text-xs sm:text-sm font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      
                      {/* Work Number - Manual Input with Dropdown */}
                      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Hash className="h-4 w-4 text-yellow-600" />
                            <span className="text-xs sm:text-sm font-medium text-gray-500">Munkaszám</span>
                          </div>
                          <span className="text-xs text-green-600 opacity-0 transition-opacity duration-300" id={`munkaszam-saved-${uploadedFile.id}`}>
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Mentve
                          </span>
                        </div>
                        <div className="relative">
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={uploadedFile.extractedData.Munkaszám || ''}
                                onChange={(e) => {
                                  const newMunkaszam = e.target.value;
                                  
                                  // Update local state
                                  setUploadedFiles(prev => prev.map(file => {
                                    if (file.id === uploadedFile.id && file.extractedData) {
                                      return {
                                        ...file,
                                        extractedData: {
                                          ...file.extractedData,
                                          Munkaszám: newMunkaszam
                                        }
                                      };
                                    }
                                    return file;
                                  }));
                                }}
                                onBlur={(e) => {
                                  const newMunkaszam = e.target.value;
                                  
                                  // Auto-save the munkaszam change when the field loses focus
                                  updateMunkaszamInDatabase(
                                    uploadedFile.id, 
                                    uploadedFile.file.name, 
                                    uploadedFile.organization, 
                                    newMunkaszam
                                  );
                                }}
                                className="flex-1 text-xs sm:text-sm font-semibold text-gray-900 bg-white border border-yellow-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 pr-10"
                                placeholder="Adja meg a munkaszámot"
                              />
                              <button 
                                id={`munkaszam-dropdown-${uploadedFile.id}-button`}
                                onClick={() => {
                                  const dropdownId = `munkaszam-dropdown-${uploadedFile.id}`;
                                  if (openDropdowns.has(dropdownId)) {
                                    setOpenDropdowns(prev => {
                                      const next = new Set(prev);
                                      next.delete(dropdownId);
                                      return next;
                                    });
                                  } else {
                                    setOpenDropdowns(prev => new Set(prev).add(dropdownId));
                                  }
                                }}
                                className="absolute inset-y-0 right-2 px-2 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                                aria-label="Open munkaszám options"
                                title="Munkaszám opciók"
                              >
                                <svg className="w-4 h-4 transition-transform duration-200" 
                                     style={{ transform: openDropdowns.has(`munkaszam-dropdown-${uploadedFile.id}`) ? 'rotate(180deg)' : 'rotate(0)' }}
                                     fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {/* Dropdown Menu */}
                          <div 
                            id={`munkaszam-dropdown-${uploadedFile.id}`} 
                            className={`absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg ${openDropdowns.has(`munkaszam-dropdown-${uploadedFile.id}`) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'} transition-all duration-150 ease-in-out`}
                          >
                            <div className="py-1 pb-4 max-h-60 overflow-auto">
                              <div className="px-3 py-2 text-xs text-gray-500 font-medium border-b border-gray-100">
                                Válasszon munkaszámot
                              </div>
                              <ul>
                                <li 
                                  className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                                  onClick={() => {
                                    const newMunkaszam = "11";
                                    setUploadedFiles(prev => prev.map(file => {
                                      if (file.id === uploadedFile.id && file.extractedData) {
                                        return {
                                          ...file,
                                          extractedData: {
                                            ...file.extractedData,
                                            Munkaszám: newMunkaszam
                                          }
                                        };
                                      }
                                      return file;
                                    }));
                                    
                                    // Close dropdown
                                    setOpenDropdowns(prev => {
                                      const next = new Set(prev);
                                      next.delete(`munkaszam-dropdown-${uploadedFile.id}`);
                                      return next;
                                    });
                                    
                                    // Save to database
                                    updateMunkaszamInDatabase(
                                      uploadedFile.id, 
                                      uploadedFile.file.name, 
                                      uploadedFile.organization, 
                                      newMunkaszam
                                    );
                                  }}
                                >
                                  <span className="font-medium text-blue-700">FR20</span>
                                  <span className="text-gray-800">11</span>
                                </li>
                                <li 
                                  className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                                  onClick={() => {
                                    const newMunkaszam = "21,22,23";
                                    setUploadedFiles(prev => prev.map(file => {
                                      if (file.id === uploadedFile.id && file.extractedData) {
                                        return {
                                          ...file,
                                          extractedData: {
                                            ...file.extractedData,
                                            Munkaszám: newMunkaszam
                                          }
                                        };
                                      }
                                      return file;
                                    }));
                                    
                                    // Close dropdown
                                    setOpenDropdowns(prev => {
                                      const next = new Set(prev);
                                      next.delete(`munkaszam-dropdown-${uploadedFile.id}`);
                                      return next;
                                    });
                                    
                                    // Save to database
                                    updateMunkaszamInDatabase(
                                      uploadedFile.id, 
                                      uploadedFile.file.name, 
                                      uploadedFile.organization, 
                                      newMunkaszam
                                    );
                                  }}
                                >
                                  <span className="font-medium text-blue-700">FR26</span>
                                  <span className="text-gray-800">21,22,23</span>
                                </li>
                                <li 
                                  className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                                  onClick={() => {
                                    const newMunkaszam = "12,24,25";
                                    setUploadedFiles(prev => prev.map(file => {
                                      if (file.id === uploadedFile.id && file.extractedData) {
                                        return {
                                          ...file,
                                          extractedData: {
                                            ...file.extractedData,
                                            Munkaszám: newMunkaszam
                                          }
                                        };
                                      }
                                      return file;
                                    }));
                                    
                                    // Close dropdown
                                    setOpenDropdowns(prev => {
                                      const next = new Set(prev);
                                      next.delete(`munkaszam-dropdown-${uploadedFile.id}`);
                                      return next;
                                    });
                                    
                                    // Save to database
                                    updateMunkaszamInDatabase(
                                      uploadedFile.id, 
                                      uploadedFile.file.name, 
                                      uploadedFile.organization, 
                                      newMunkaszam
                                    );
                                  }}
                                >
                                  <span className="font-medium text-blue-700">TOR</span>
                                  <span className="text-gray-800">12,24,25</span>
                                </li>
                                <li 
                                  className="px-3 py-2 text-xs hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors"
                                  onClick={() => {
                                    const newMunkaszam = "13,26";
                                    setUploadedFiles(prev => prev.map(file => {
                                      if (file.id === uploadedFile.id && file.extractedData) {
                                        return {
                                          ...file,
                                          extractedData: {
                                            ...file.extractedData,
                                            Munkaszám: newMunkaszam
                                          }
                                        };
                                      }
                                      return file;
                                    }));
                                    
                                    // Close dropdown
                                    setOpenDropdowns(prev => {
                                      const next = new Set(prev);
                                      next.delete(`munkaszam-dropdown-${uploadedFile.id}`);
                                      return next;
                                    });
                                    
                                    // Save to database
                                    updateMunkaszamInDatabase(
                                      uploadedFile.id, 
                                      uploadedFile.file.name, 
                                      uploadedFile.organization, 
                                      newMunkaszam
                                    );
                                  }}
                                >
                                  <span className="font-medium text-blue-700">LEV</span>
                                  <span className="text-gray-800">13,26</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
};   

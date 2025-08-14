import React, { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { X, Download, ExternalLink } from 'lucide-react';

interface DocumentRow {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  description: string | null;
  file_name: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  scanned_pdf: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface DocumentPreviewModalProps {
  documentId: string;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  documentId,
  onClose,
}) => {
  const [document, setDocument] = useState<DocumentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      setDocument(data);

      // Get preview URL
      const { data: urlData, error: urlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(data.storage_path, 300); // 5 minutes

      if (!urlError && urlData?.signedUrl) {
        setPreviewUrl(urlData.signedUrl);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async () => {
    if (!document) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(document.storage_path, 60);

      if (!error && data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
          <p className="text-gray-600">Dokumentum nem található.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    );
  }

  const isPdf = document.file_type === 'application/pdf';
  const isImage = document.file_type?.startsWith('image/');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 truncate">{document.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{document.file_name}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {previewUrl && (
              <>
                <button
                  onClick={openInNewTab}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Megnyitás új lapon"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button
                  onClick={downloadDocument}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Letöltés"
                >
                  <Download className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {previewUrl ? (
            <div className="h-full">
              {isPdf ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full"
                  title="Document Preview"
                />
              ) : isImage ? (
                <div className="h-full flex items-center justify-center p-6 bg-gray-50">
                  <img
                    src={previewUrl}
                    alt={document.title}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Előnézet nem elérhető</h3>
                    <p className="text-gray-500 mb-4">Ez a fájltípus nem támogatott az előnézethez.</p>
                    <button
                      onClick={downloadDocument}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Letöltés
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Előnézet nem elérhető</h3>
                <p className="text-gray-500">A dokumentum előnézete nem tölthető be.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with document info */}
        {document.description && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Leírás</h4>
            <p className="text-sm text-gray-600">{document.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};
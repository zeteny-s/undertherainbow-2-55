import React, { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { X, Save, FileText, Eye, Download } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

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

interface DocumentEditModalProps {
  documentId: string;
  onClose: () => void;
  onDocumentUpdated: (document: DocumentRow) => void;
}

export const DocumentEditModal: React.FC<DocumentEditModalProps> = ({
  documentId,
  onClose,
  onDocumentUpdated,
}) => {
  const [document, setDocument] = useState<DocumentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
      setTitle(data.title);
      setDescription(data.description || '');

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

  const handleSave = async () => {
    if (!document || !title.trim()) return;

    try {
      setSaving(true);
      const { data, error } = await (supabase as any)
        .from('documents')
        .update({
          title: title.trim(),
          description: description.trim() || null,
        })
        .eq('id', documentId)
        .select('*')
        .single();

      if (error) throw error;

      onDocumentUpdated(data);
      onClose();
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      setSaving(false);
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
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] flex">
        {/* Left Side - Document Info */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Dokumentum szerkesztése</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* File Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{document.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round((document.file_size || 0) / 1024)} KB
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Létrehozva: {formatDate(document.created_at)}</p>
                  <p>Módosítva: {formatDate(document.updated_at)}</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cím *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Dokumentum címe"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leírás
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Dokumentum leírása (opcionális)"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={downloadDocument}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Letöltés
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={saving}
              >
                Mégse
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Mentés
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Document Preview */}
        <div className="flex-1 flex flex-col">
          {/* Preview Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900">Előnézet</h3>
            </div>
          </div>

          {/* Preview Content */}
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
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Előnézet nem elérhető</h4>
                      <p className="text-gray-500">Ez a fájltípus nem támogatott az előnézethez.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Előnézet nem elérhető</h4>
                  <p className="text-gray-500">A dokumentum előnézete nem tölthető be.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
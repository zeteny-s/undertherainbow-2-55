import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { MobileScanner } from '../MobileScanner';
import { Upload, Download, Share2, Edit, Eye, Plus, FileText, Folder } from 'lucide-react';
import { ShareDialog } from './ShareDialog';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { DocumentEditModal } from './DocumentEditModal';
import { formatDate } from '../../utils/formatters';

interface DocFolder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

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

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [shareDocId, setShareDocId] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [editDocId, setEditDocId] = useState<string | null>(null);

  const activeFolderName = useMemo(() => {
    if (!currentFolderId) return 'Összes dokumentum';
    return folders.find((f) => f.id === currentFolderId)?.name || 'Mappa';
  }, [currentFolderId, folders]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        // Load folders for user
        const { data: f } = await (supabase as any)
          .from('document_folders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        setFolders(f || []);

        // Load documents (RLS ensures visibility: own + shared)
        const query = (supabase as any).from('documents').select('*').order('created_at', { ascending: false });
        const { data: d } = currentFolderId ? await query.eq('folder_id', currentFolderId) : await query;
        setDocs(d || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, currentFolderId]);

  const refreshDocs = async () => {
    if (!user) return;
    const query = (supabase as any).from('documents').select('*').order('created_at', { ascending: false });
    const { data: d } = currentFolderId ? await query.eq('folder_id', currentFolderId) : await query;
    setDocs(d || []);
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const { data, error } = await (supabase as any)
        .from('document_folders')
        .insert({ user_id: user.id, name: newFolderName.trim(), parent_id: null })
        .select('*')
        .single();
      if (!error && data) {
        setFolders((prev) => [...prev, data]);
        setNewFolderName('');
      }
    } finally {
      setCreatingFolder(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!user || files.length === 0) return;
    setLoading(true);
    try {
      for (const file of files) {
        const key = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('documents').upload(key, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (upErr) throw upErr;
        const insertPayload = {
          user_id: user.id,
          folder_id: currentFolderId,
          title: file.name,
          description: null,
          file_name: file.name,
          storage_path: key,
          file_type: file.type,
          file_size: file.size,
          scanned_pdf: file.type === 'application/pdf',
          metadata: null,
        };
        const { data } = await (supabase as any)
          .from('documents')
          .insert(insertPayload)
          .select('*')
          .single();
        if (data) setDocs((prev) => [data, ...prev]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanComplete = async (pdfBlob: Blob, defaultName: string) => {
    setShowScanner(false);
    const file = new File([pdfBlob], defaultName || `Scan-${Date.now()}.pdf`, { type: 'application/pdf' });
    await uploadFiles([file]);
  };

  const handleDocumentUpdated = (updatedDoc: DocumentRow) => {
    setDocs((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
  };

  const downloadDoc = async (doc: DocumentRow) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 60);
    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dokumentumok</h1>
          <p className="text-gray-600 mt-1">Dokumentumok kezelése és szervezése</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Feltöltés</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const f = Array.from(e.target.files || []);
                uploadFiles(f);
                e.currentTarget.value = '';
              }}
            />
          </label>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setShowScanner(true)}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Szkennelés</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Folder className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Mappák</h3>
            </div>
            
            <div className="space-y-4 mb-4">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Új mappa neve"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFolderName.trim()) {
                      createFolder();
                    }
                  }}
                />
                <button
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={createFolder}
                  disabled={creatingFolder || !newFolderName.trim()}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <button
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !currentFolderId 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setCurrentFolderId(null)}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Összes dokumentum
                </div>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentFolderId === folder.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    {folder.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="lg:col-span-9">
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{activeFolderName}</h2>
                  <p className="text-sm text-gray-500 mt-1">{docs.length} dokumentum</p>
                </div>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Betöltés...
                  </div>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {docs.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span>{doc.file_name}</span>
                          <span>•</span>
                          <span>{Math.round((doc.file_size || 0) / 1024)} KB</span>
                          <span>•</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1 truncate">{doc.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setPreviewDocId(doc.id)}
                        title="Előnézet"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setEditDocId(doc.id)}
                        title="Szerkesztés"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setShareDocId(doc.id)}
                        title="Megosztás"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => downloadDoc(doc)}
                        title="Letöltés"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {docs.length === 0 && !loading && (
                <div className="px-6 py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nincs dokumentum</h3>
                  <p className="text-gray-500 mb-6">Ebben a mappában még nincsenek dokumentumok.</p>
                  <div className="flex items-center justify-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span className="text-sm font-medium">Fájl feltöltése</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const f = Array.from(e.target.files || []);
                          uploadFiles(f);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setShowScanner(true)}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Szkennelés</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="w-full h-full">
            <MobileScanner
              onScanComplete={handleScanComplete}
              onClose={() => setShowScanner(false)}
            />
          </div>
        </div>
      )}

      {shareDocId && (
        <ShareDialog
          documentId={shareDocId}
          onClose={() => setShareDocId(null)}
          onShared={() => {
            setShareDocId(null);
            refreshDocs();
          }}
        />
      )}

      {previewDocId && (
        <DocumentPreviewModal
          documentId={previewDocId}
          onClose={() => setPreviewDocId(null)}
        />
      )}

      {editDocId && (
        <DocumentEditModal
          documentId={editDocId}
          onClose={() => setEditDocId(null)}
          onDocumentUpdated={handleDocumentUpdated}
        />
      )}
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { MobileScanner } from '../MobileScanner';
import { Upload, FolderPlus, Download, Share2, Edit, Save, X } from 'lucide-react';
import { ShareDialog } from './ShareDialog';

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
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [shareDocId, setShareDocId] = useState<string | null>(null);

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

  const startEditing = (doc: DocumentRow) => {
    setEditingDocId(doc.id);
    setEditTitle(doc.title);
    setEditDescription(doc.description || '');
  };

  const saveEdit = async () => {
    if (!editingDocId) return;
    const { data } = await (supabase as any)
      .from('documents')
      .update({ title: editTitle.trim() || 'Dokumentum', description: editDescription })
      .eq('id', editingDocId)
      .select('*')
      .single();
    if (data) {
      setDocs((prev) => prev.map((d) => (d.id === data.id ? data : d)));
    }
    setEditingDocId(null);
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dokumentumok</h1>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />
            Feltöltés
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
            className="inline-flex items-center px-3 py-2 rounded-lg border hover:bg-gray-50"
            onClick={() => setShowScanner(true)}
          >
            <Share2 className="w-4 h-4 mr-2 rotate-90" />
            Szkennelés
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3">
          <div className="p-4 rounded-xl border bg-white">
            <div className="flex items-center gap-2 mb-3">
              <FolderPlus className="w-4 h-4" />
              <span className="font-medium">Mappák</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="Új mappa neve"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <button
                className="px-3 py-2 rounded-lg border hover:bg-gray-50"
                onClick={createFolder}
                disabled={creatingFolder || !newFolderName.trim()}
              >
                Létrehozás
              </button>
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 ${!currentFolderId ? 'bg-gray-100' : ''}`}
                  onClick={() => setCurrentFolderId(null)}
                >
                  Összes dokumentum
                </button>
              </li>
              {folders.map((f) => (
                <li key={f.id}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 ${currentFolderId === f.id ? 'bg-gray-100' : ''}`}
                    onClick={() => setCurrentFolderId(f.id)}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="lg:col-span-9">
          <div className="rounded-xl border bg-white">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{activeFolderName}</h2>
                <p className="text-sm text-gray-500">{docs.length} dokumentum</p>
              </div>
              {loading && <div className="text-sm text-gray-500">Betöltés...</div>}
            </div>

            <div className="divide-y">
              {docs.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between">
                  {editingDocId === doc.id ? (
                    <div className="flex-1 mr-4">
                      <input
                        className="w-full border rounded-lg px-3 py-2 mb-2"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                      <textarea
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="Leírás"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-gray-500">{doc.file_name} • {(doc.file_size || 0) / 1024 | 0} KB</div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {editingDocId === doc.id ? (
                      <>
                        <button className="p-2 rounded-lg border hover:bg-gray-50" onClick={saveEdit}>
                          <Save className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg border hover:bg-gray-50" onClick={() => setEditingDocId(null)}>
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="p-2 rounded-lg border hover:bg-gray-50" onClick={() => startEditing(doc)}>
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg border hover:bg-gray-50" onClick={() => setShareDocId(doc.id)}>
                          <Share2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button className="p-2 rounded-lg border hover:bg-gray-50" onClick={() => downloadDoc(doc)}>
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {docs.length === 0 && (
                <div className="p-8 text-center text-gray-500">Nincs dokumentum ebben a mappában</div>
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
    </div>
  );
};

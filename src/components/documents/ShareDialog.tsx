import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { X, Share2, Mail, UserPlus } from 'lucide-react';

interface ShareDialogProps {
  documentId: string;
  onClose: () => void;
  onShared: () => void;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ documentId, onClose, onShared }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareInternally = async () => {
    if (!user || !email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data: profiles, error: findErr } = await (supabase as any)
        .from('profiles')
        .select('id, email')
        .eq('email', email.trim())
        .limit(1);
      if (findErr) throw findErr;
      if (!profiles || profiles.length === 0) {
        setError('Nincs felhasználó ezzel az email címmel');
        return;
      }
      const recipient = profiles[0];
      const { error: insertErr } = await (supabase as any)
        .from('document_shares')
        .insert({
          document_id: documentId,
          shared_by: user.id,
          shared_with: recipient.id,
          permission,
        });
      if (insertErr) throw insertErr;
      onShared();
    } catch (e: any) {
      setError(e.message || 'Megosztás sikertelen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl border shadow-lg">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Share2 className="w-4 h-4" />
            Dokumentum megosztása
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-50" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Megosztás felhasználóval (belső)</label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="felhasznalo@pelda.hu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                className="border rounded-lg px-2 py-2"
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'viewer' | 'editor')}
              >
                <option value="viewer">Megtekintő</option>
                <option value="editor">Szerkesztő</option>
              </select>
              <button
                className="inline-flex items-center px-3 py-2 rounded-lg border hover:bg-gray-50"
                onClick={shareInternally}
                disabled={loading}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Hozzáadás
              </button>
            </div>
          </div>

          <div className="pt-2 border-t">
            <label className="block text-sm font-medium mb-1">Megosztás emailben (külső)</label>
            <p className="text-sm text-gray-500 mb-2">
              Külső email megosztáshoz állítsa be a RESEND_API_KEY titkot, és jelezze nekünk – bekapcsoljuk a funkciót.
            </p>
            <button className="inline-flex items-center px-3 py-2 rounded-lg border opacity-60 cursor-not-allowed">
              <Mail className="w-4 h-4 mr-2" />
              Email küldése (hamarosan)
            </button>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={onClose}>Kész</button>
        </div>
      </div>
    </div>
  );
};

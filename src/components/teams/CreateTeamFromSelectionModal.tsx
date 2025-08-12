import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../common/NotificationContainer';

interface CreateTeamFromSelectionModalProps {
  selectedUserIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTeamFromSelectionModal: React.FC<CreateTeamFromSelectionModalProps> = ({ selectedUserIds, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const { notifications, addNotification, removeNotification } = useNotifications();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', selectedUserIds);
      setProfiles((data || []) as any);
      if (data && data.length > 0) setLeadId(data[0].id);
    };
    fetch();
  }, [selectedUserIds]);

  const canSubmit = useMemo(() => name.trim().length > 1 && leadId && selectedUserIds.length > 0, [name, leadId, selectedUserIds]);

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .insert({ name: name.trim(), description: description.trim() || null, created_by: user.id })
        .select('id')
        .maybeSingle();
      if (error || !team) throw error || new Error('Team not created');

      const members: { user_id: string; team_id: string; role: 'member' | 'lead' }[] = selectedUserIds.map(uid => ({
        user_id: uid,
        team_id: team.id,
        role: (uid === leadId ? 'lead' : 'member') as 'lead' | 'member',
      }));
      const { error: memErr } = await supabase.from('team_members').insert(members);
      if (memErr) throw memErr;

      addNotification('success', 'Team created successfully');
      onSuccess();
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-lg p-6 animate-enter">
        <h3 className="text-lg font-semibold text-foreground mb-4">Create Team from Accounts</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Team name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground" placeholder="Team name" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground" placeholder="Optional description" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Team Lead</label>
            <select value={leadId} onChange={e => setLeadId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground">
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Members ({selectedUserIds.length})</label>
            <div className="max-h-32 overflow-auto rounded-md border border-border p-2 text-sm text-muted-foreground bg-muted/30">
              {profiles.map(p => (
                <div key={p.id}>{p.name || p.email}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-border text-foreground">Cancel</button>
          <button onClick={handleCreate} disabled={!canSubmit || loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </div>

        <NotificationContainer notifications={notifications} onRemove={removeNotification} position="top-right" />
      </div>
    </div>
  );
};

export default CreateTeamFromSelectionModal;

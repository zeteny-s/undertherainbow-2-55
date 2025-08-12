import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationContainer } from '../common/NotificationContainer';
import { Search, Users, Plus } from 'lucide-react';

interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  profile_type: string | null;
  created_at: string;
}

interface AccountsDirectoryProps {}

export const AccountsDirectory: React.FC<AccountsDirectoryProps> = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { notifications, addNotification, removeNotification } = useNotifications();

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, profile_type, created_at')
      .order('name', { ascending: true, nullsFirst: true });
    if (error) {
      addNotification('error', 'Failed to load accounts');
    } else {
      setProfiles((data || []) as ProfileRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return profiles.filter(p =>
      (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q)
    );
  }, [profiles, query]);

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  const clearSelection = () => setSelected({});

  const selectedIds = useMemo(() => Object.keys(selected).filter(k => selected[k]), [selected]);

  return (
    <section className="space-y-4 animate-fade-in" aria-labelledby="accounts-title">
      <header className="flex items-center justify-between">
        <div>
          <h2 id="accounts-title" className="text-xl font-semibold text-foreground">Accounts</h2>
          <p className="text-sm text-muted-foreground">Select accounts to create teams</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search accounts..."
              className="pl-8 pr-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Search accounts"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={selectedIds.length === 0}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" /> Create Team ({selectedIds.length})
          </button>
          {selectedIds.length > 0 && (
            <button onClick={clearSelection} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
          )}
        </div>
      </header>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-xs text-muted-foreground">
            <div className="col-span-1"></div>
            <div className="col-span-3">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Created</div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map(p => (
              <label key={p.id} className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={!!selected[p.id]}
                  onChange={() => toggle(p.id)}
                  className="h-4 w-4"
                  aria-label={`Select ${p.name || p.email}`}
                />
                <div className="col-span-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground text-sm">{p.name || '—'}</span>
                </div>
                <div className="col-span-4 text-sm text-muted-foreground">{p.email || '—'}</div>
                <div className="col-span-2 text-xs">
                  <span className="px-2 py-1 rounded bg-muted/60 text-foreground">{p.profile_type || '—'}</span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString('hu-HU')}</div>
              </label>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No accounts found</div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateTeamFromSelectionModal
          selectedUserIds={selectedIds}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            addNotification('success', 'Team created');
            setShowCreateModal(false);
            clearSelection();
          }}
        />
      )}

      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </section>
  );
};

export default AccountsDirectory;

import { CreateTeamFromSelectionModal } from './CreateTeamFromSelectionModal';

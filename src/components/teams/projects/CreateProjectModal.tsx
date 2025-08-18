import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../integrations/supabase/client';
import { LoadingSpinner } from '../../common/LoadingSpinner';

import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationContainer } from '../../common/NotificationContainer';

interface ProjectRow {
  id: string;
  name: string;
  description?: string | null;
  status: 'planned' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  team_id: string;
  created_by: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamRow { id: string; name: string; }

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState<string>('');
  const [status, setStatus] = useState<ProjectRow['status']>('planned');
  const [priority, setPriority] = useState<ProjectRow['priority']>('medium');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifications, addNotification, removeNotification } = useNotifications();

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      const { data } = await supabase.from('teams').select('id, name').order('name');
      setTeams((data || []) as TeamRow[]);
      setLoading(false);
    };
    fetchTeams();
  }, []);

  const canSubmit = useMemo(() => name.trim().length > 1 && teamId && !!user, [name, teamId, user]);

  const createProject = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any).from('projects').insert({
        name: name.trim(),
        description: description.trim() || null,
        team_id: teamId,
        status,
        priority,
        start_date: startDate || null,
        end_date: endDate || null,
        created_by: user.id,
      });
      if (error) throw error;
      addNotification('success', 'Project created');
      onCreated();
      onClose();
    } catch (e: any) {
      console.error(e);
      addNotification('error', e?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-lg shadow-xl w-full max-w-xl p-6 animate-enter">
        <h3 className="text-lg font-semibold text-foreground mb-4">Create Project</h3>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground" placeholder="Project name" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-muted-foreground mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground" placeholder="Optional description" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Team</label>
              <select value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground">
                <option value="">Select team</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground">
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground" />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground" />
            </div>
          </div>
        )}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-border text-foreground">Cancel</button>
          <button onClick={createProject} disabled={!canSubmit || loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
        <NotificationContainer notifications={notifications} onRemove={removeNotification} position="top-right" />
      </div>
    </div>
  );
};

export default CreateProjectModal;

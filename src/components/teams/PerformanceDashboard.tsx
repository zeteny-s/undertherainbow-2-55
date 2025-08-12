import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { BarChart3 } from 'lucide-react';

interface Profile { id: string; name: string | null; email: string | null; }
interface Task { id: string; assigned_to: string; status: 'pending'|'in_progress'|'completed'|'cancelled'; created_at: string; completed_at?: string | null; }
interface Project { id: string; name: string; status: 'planned'|'active'|'on_hold'|'completed'|'cancelled'; created_at: string; }

export const PerformanceDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: profs }, { data: tks }, { data: projs }] = await Promise.all([
      supabase.from('profiles').select('id, name, email'),
      supabase.from('tasks').select('id, assigned_to, status, created_at, completed_at'),
      supabase.from('projects').select('id, name, status, created_at')
    ]);
    setProfiles((profs || []) as Profile[]);
    setTasks((tks || []) as Task[]);
    setProjects((projs || []) as Project[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const userMetrics = useMemo(() => {
    const byUser: Record<string, { total: number; completed: number; in_progress: number; pending: number; cancelled: number }> = {};
    tasks.forEach(t => {
      if (!byUser[t.assigned_to]) byUser[t.assigned_to] = { total: 0, completed: 0, in_progress: 0, pending: 0, cancelled: 0 };
      byUser[t.assigned_to].total += 1;
      byUser[t.assigned_to][t.status] += 1 as any;
    });
    return byUser;
  }, [tasks]);

  const projectMetrics = useMemo(() => {
    const byStatus: Record<Project['status'], number> = { planned: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 };
    projects.forEach(p => { byStatus[p.status] += 1; });
    return byStatus;
  }, [projects]);

  if (loading) return <LoadingSpinner />;

  return (
    <section className="space-y-6 animate-fade-in" aria-labelledby="performance-title">
      <header>
        <h2 id="performance-title" className="text-xl font-semibold text-foreground flex items-center gap-2"><BarChart3 className="h-5 w-5" />Performance</h2>
        <p className="text-sm text-muted-foreground">Individuals and projects performance overview</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3">Individuals</h3>
          <div className="divide-y divide-border">
            {profiles.map(p => {
              const m = userMetrics[p.id] || { total: 0, completed: 0, in_progress: 0, pending: 0, cancelled: 0 };
              const completion = m.total ? Math.round((m.completed / m.total) * 100) : 0;
              return (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-foreground">{p.name || p.email}</div>
                    <div className="text-xs text-muted-foreground">Tasks: {m.total} • Completed: {m.completed} • In progress: {m.in_progress}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{completion}%</div>
                </div>
              );
            })}
            {profiles.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">No users</div>
            )}
          </div>
        </article>

        <article className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-medium text-foreground mb-3">Projects</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {(['planned','active','on_hold','completed','cancelled'] as Project['status'][]).map(s => (
              <div key={s} className="rounded-md border border-border bg-muted/40 p-3">
                <div className="text-foreground font-medium">{projectMetrics[s]}</div>
                <div className="text-xs text-muted-foreground capitalize">{s.replace('_',' ')}</div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
};

export default PerformanceDashboard;

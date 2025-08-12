import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../integrations/supabase/client';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Calendar, RefreshCw, Flag } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';

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

interface TaskRow {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id?: string | null;
}

export const ProjectsPortfolio: React.FC = () => {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: proj }, { data: taskData }] = await Promise.all([
      (supabase as any).from('projects').select('*').order('created_at', { ascending: false }),
      (supabase as any).from('tasks').select('id, title, status, priority, project_id')
    ]);
    setProjects((proj || []) as ProjectRow[]);
    setTasks((taskData || []) as TaskRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const metrics = useMemo(() => {
    const byProject: Record<string, { total: number; completed: number; in_progress: number; pending: number; cancelled: number }> = {};
    tasks.forEach(t => {
      if (!t.project_id) return;
      if (!byProject[t.project_id]) byProject[t.project_id] = { total: 0, completed: 0, in_progress: 0, pending: 0, cancelled: 0 };
      byProject[t.project_id].total += 1;
      byProject[t.project_id][t.status] += 1 as any;
    });
    return byProject;
  }, [tasks]);

  if (loading) return <LoadingSpinner />;

  return (
    <section className="space-y-4 animate-fade-in" aria-labelledby="projects-portfolio-title">
      <header className="flex items-center justify-between">
        <div>
          <h2 id="projects-portfolio-title" className="text-xl font-semibold text-foreground">Projects portfolio</h2>
          <p className="text-sm text-muted-foreground">Create and track projects</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90">
            <Flag className="h-4 w-4" /> New Project
          </button>
          <button onClick={refresh} className="inline-flex items-center gap-2 border border-border px-3 py-2 rounded-md hover:bg-muted/40">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map(p => {
          const m = metrics[p.id] || { total: 0, completed: 0, in_progress: 0, pending: 0, cancelled: 0 };
          const completion = m.total ? Math.round((m.completed / m.total) * 100) : 0;
          return (
            <article key={p.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{p.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  p.status === 'completed' ? 'bg-primary/10 text-primary' :
                  p.status === 'active' ? 'bg-muted text-foreground' :
                  p.status === 'on_hold' ? 'bg-muted text-muted-foreground' :
                  p.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'
                }`}>{p.status}</span>
              </div>
              {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md border border-border bg-muted/40 p-2 text-center">
                  <div className="font-medium text-foreground">{m.total}</div>
                  <div className="text-muted-foreground">Tasks</div>
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-2 text-center">
                  <div className="font-medium text-foreground">{m.completed}</div>
                  <div className="text-muted-foreground">Completed</div>
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-2 text-center">
                  <div className="font-medium text-foreground">{completion}%</div>
                  <div className="text-muted-foreground">Progress</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                {p.start_date && (
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(p.start_date).toLocaleDateString('hu-HU')}</span>
                )}
                {p.end_date && (
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(p.end_date).toLocaleDateString('hu-HU')}</span>
                )}
              </div>
            </article>
          );
        })}
        {projects.length === 0 && (
          <div className="col-span-full text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-md">
            No projects yet
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={refresh} />
      )}
    </section>
  );
};

export default ProjectsPortfolio;

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import type { TeamTask } from '../../../types/teams';
import { LoadingSpinner } from '../../common/LoadingSpinner';

const cols = [
  { id: 'pending', title: 'Várakozik' },
  { id: 'in_progress', title: 'Folyamatban' },
  { id: 'completed', title: 'Kész' },
  { id: 'cancelled', title: 'Törölve' },
] as const;

type Status = typeof cols[number]['id'];

export const ProjectsBoard: React.FC = () => {
  const [items, setItems] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('team_tasks')
      .select('id, title, description, status, priority, due_date, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (!error && data) setItems(data as TeamTask[]);
    setLoading(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    return cols.map(c => ({
      id: c.id,
      title: c.title,
      items: items.filter(i => i.status === (c.id as Status))
    }));
  }, [items]);

  if (loading) return <LoadingSpinner />;

  return (
    <section aria-labelledby="projects-board-title" className="space-y-4 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h2 id="projects-board-title" className="text-xl font-semibold text-foreground">Projektek</h2>
          <p className="text-sm text-muted-foreground">Csapatszintű feladatok státusz szerint</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors" aria-label="Frissítés">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Frissítés
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {grouped.map(col => (
          <article key={col.id} className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-3">{col.title} <span className="text-muted-foreground">({col.items.length})</span></h3>
            <div className="space-y-3 min-h-[120px]">
              {col.items.map(task => (
                <div key={task.id} className="rounded-md border border-border bg-muted/40 p-3 animate-fade-in hover-scale">
                  <div className="text-sm font-medium text-foreground">{task.title}</div>
                  {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded ${
                      task.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
                      task.priority === 'high' ? 'bg-primary/10 text-primary' :
                      task.priority === 'medium' ? 'bg-muted text-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(task.due_date).toLocaleDateString('hu-HU')}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {col.items.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-md">
                  Nincs feladat
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ProjectsBoard;

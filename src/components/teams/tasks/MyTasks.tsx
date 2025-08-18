import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../integrations/supabase/client';
import type { Task } from '../../../types/teams';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader2, CheckCircle2, Clock, AlertTriangle, ChevronDown } from 'lucide-react';

export const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Task['status']>('all');

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date, created_at, updated_at')
      .eq('assigned_to', user.id)
      .order('created_at', { ascending: false });
    setTasks((data || []) as Task[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const visible = useMemo(() => {
    return filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  }, [tasks, filter]);

  const updateStatus = async (taskId: string, status: Task['status']) => {
    setUpdatingId(taskId);
    await supabase
      .from('tasks')
      .update({
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);
    setUpdatingId(null);
    fetchTasks();
  };

  if (loading) return (
    <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>
  );

  return (
    <section aria-labelledby="my-tasks-title" className="space-y-4 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h2 id="my-tasks-title" className="text-xl font-semibold text-foreground">Feladataim</h2>
          <p className="text-sm text-muted-foreground">Személyes feladatok és státuszok</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2 rounded-md bg-muted text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Szűrő"
            >
              <option value="all">Összes</option>
              <option value="pending">Várakozik</option>
              <option value="in_progress">Folyamatban</option>
              <option value="completed">Kész</option>
              <option value="cancelled">Törölve</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </header>

      {visible.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-10 border border-dashed border-border rounded-md">
          Nincsenek feladatok.
        </div>
      ) : (
        <ul className="grid gap-3">
          {visible.map((task) => (
            <li key={task.id} className="bg-card border border-border rounded-lg p-4 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                  {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded ${
                      task.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
                      task.priority === 'high' ? 'bg-primary/10 text-primary' :
                      task.priority === 'medium' ? 'bg-muted text-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {task.priority}
                    </span>
                    {task.status === 'in_progress' && (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Clock className="h-3.5 w-3.5" /> folyamatban
                      </span>
                    )}
                    {task.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> törölve
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => updateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    aria-label="Státusz váltás"
                    disabled={updatingId === task.id}
                  >
                    {updatingId === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {task.status === 'completed' ? 'Visszaállítás' : 'Készre jelölés'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MyTasks;

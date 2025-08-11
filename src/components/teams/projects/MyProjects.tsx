import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../integrations/supabase/client';
import { useAuth } from '../../../contexts/AuthContext';
import type { TeamTask } from '../../../types/teams';
import { Loader2 } from 'lucide-react';

export const MyProjects: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TeamTask[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data: tm } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      const teamIds = (tm || []).map((r: any) => r.team_id);
      if (teamIds.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const { data: t } = await supabase
        .from('team_tasks')
        .select('id, title, description, status, priority, due_date, created_at')
        .in('team_id', teamIds)
        .order('created_at', { ascending: false });

      setTasks((t || []) as TeamTask[]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const grouped = useMemo(() => ({
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
    cancelled: tasks.filter(t => t.status === 'cancelled'),
  }), [tasks]);

  if (loading) return <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <section className="space-y-4 animate-fade-in">
      <header>
        <h2 className="text-xl font-semibold text-foreground">Projekt Feladataim</h2>
        <p className="text-sm text-muted-foreground">Azok a projektek, ahol tag vagyok</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {([['pending','Várakozik'], ['in_progress','Folyamatban'], ['completed','Kész'], ['cancelled','Törölve']] as const).map(([key, label]) => (
          <article key={key} className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-medium text-foreground mb-3">{label} <span className="text-muted-foreground">({(grouped as any)[key].length})</span></h3>
            <div className="space-y-3 min-h-[120px]">
              {(grouped as any)[key].map((task: TeamTask) => (
                <div key={task.id} className="rounded-md border border-border bg-muted/40 p-3 animate-fade-in hover-scale">
                  <div className="text-sm font-medium text-foreground">{task.title}</div>
                  {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
                </div>
              ))}
              {(grouped as any)[key].length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-md">Nincs feladat</div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default MyProjects;

export interface PMProject {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string | null;
  end_date?: string | null;
  budget: number;
  team_members: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PMBoard {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  tasks?: PMTask[];
}

export interface PMTask {
  id: string;
  project_id: string;
  board_id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string | null;
  assigned_by: string;
  due_date?: string | null;
  completed_at?: string | null;
  position: number;
  labels: string[];
  created_at: string;
  updated_at: string;
  comments?: PMComment[];
  assigned_to_profile?: {
    name: string | null;
    email: string | null;
  };
}

export interface PMComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    name: string | null;
    email: string | null;
  };
}

export interface PMAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  projectsByStatus: {
    planning: number;
    active: number;
    on_hold: number;
    completed: number;
    cancelled: number;
  };
  tasksByStatus: {
    todo: number;
    in_progress: number;
    review: number;
    done: number;
  };
  teamPerformance: {
    userId: string;
    name: string;
    tasksCompleted: number;
    tasksAssigned: number;
    completionRate: number;
  }[];
}

export interface DragEndEvent {
  active: {
    id: string;
    data: {
      current: PMTask;
    };
  };
  over: {
    id: string;
    data?: {
      current?: PMBoard | PMTask;
    };
  } | null;
}
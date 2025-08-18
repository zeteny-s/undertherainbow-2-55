export interface PMProject {
  id: string;
  name: string;
  description?: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  progress: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  customer_id?: string | null;
}

export interface PMTask {
  id: string;
  project_id: string;
  board_id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PMBoard {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  position: number;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PMTaskComment {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  created_by: string;
  user?: {
    name: string | null;
    email: string | null;
  };
}

export interface PMTeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  user?: {
    name: string | null;
    email: string | null;
  };
}
export interface Team {
  id: string;
  name: string;
  description?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: 'member' | 'lead';
  joined_at: string;
  profiles?: {
    name: string | null;
    email: string | null;
    profile_type: string | null;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  assigned_to: string;
  assigned_by: string;
  team_id?: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_profile?: {
    name: string | null;
    email: string | null;
  };
}

export interface TeamTask {
  id: string;
  title: string;
  description?: string | null;
  team_id: string;
  created_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  team?: {
    name: string;
  };
}

export interface Profile {
  id: string;
  name?: string | null;
  email?: string | null;
  profile_type: string | null;
  created_at: string;
  updated_at: string;
}
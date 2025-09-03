export interface Family {
  id: string;
  name: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  address?: string;
  children_count: number;
  created_at: string;
  updated_at: string;
}

export interface HouseLeader {
  id: string;
  user_id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  max_families: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyAssignment {
  id: string;
  house_leader_id: string;
  family_id: string;
  assigned_date: string;
  status: 'active' | 'transferred' | 'completed';
  academic_year: string;
  created_at: string;
}

export interface InteractionType {
  id: string;
  name: string;
  description?: string;
  hour_value: number;
  tier: 1 | 2 | 3 | 4;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface ParentInteraction {
  id: string;
  house_leader_id: string;
  family_id: string;
  interaction_type_id: string;
  interaction_date: string;
  duration_minutes?: number;
  hour_value: number;
  title: string;
  description: string;
  participants: string[];
  key_topics: string[];
  action_items: string[];
  follow_up_date?: string;
  follow_up_completed: boolean;
  quality_rating?: number;
  cultural_notes?: string;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  created_at: string;
  updated_at: string;
  interaction_types?: InteractionType;
  families?: Family;
}

export interface AnnualProgress {
  id: string;
  house_leader_id: string;
  family_id: string;
  academic_year: string;
  total_hours: number;
  total_interactions: number;
  goal_hours: number;
  last_interaction_date?: string;
  status: 'in_progress' | 'completed' | 'at_risk';
  created_at: string;
  updated_at: string;
}

export interface InteractionForm {
  interaction_type_id: string;
  interaction_date: Date;
  title: string;
  description: string;
  participants: string[];
  key_topics: string[];
  action_items: string[];
  follow_up_date?: Date;
  quality_rating?: number;
  cultural_notes?: string;
  duration_minutes?: number;
}
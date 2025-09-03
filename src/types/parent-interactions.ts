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
  status: string | null;
  max_families: number | null;
  created_at: string | null;
  updated_at: string | null;
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
  description?: string | null;
  hour_value: number;
  tier: number | null;
  color: string | null;
  icon: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface ParentInteraction {
  id: string;
  house_leader_id: string;
  family_id: string;
  interaction_type_id: string;
  interaction_date: string;
  duration_minutes?: number | null;
  hour_value: number;
  title: string;
  description: string;
  participants: string[] | null;
  key_topics: string[] | null;
  action_items: string[] | null;
  follow_up_date?: string | null;
  follow_up_completed: boolean | null;
  quality_rating?: number | null;
  cultural_notes?: string | null;
  attachments: any;
  created_at: string | null;
  updated_at: string | null;
  interaction_types?: InteractionType;
  families?: Family;
}

export interface AnnualProgress {
  id: string;
  house_leader_id: string;
  family_id: string;
  academic_year: string;
  total_hours: number | null;
  total_interactions: number | null;
  goal_hours: number | null;
  last_interaction_date?: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
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
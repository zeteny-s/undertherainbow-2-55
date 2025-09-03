export interface Family {
  id: string;
  name: string;
  house_leader_id: string;
  child_name?: string | null;
  child_age?: number | null;
  start_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyInteraction {
  id: string;
  family_id: string;
  house_leader_id: string;
  interaction_date: string;
  category: InteractionCategory;
  duration_minutes: number;
  location?: string | null;
  notes?: string | null;
  satisfaction_level?: number | null;
  referral_opportunity: boolean | null;
  next_steps?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnualProgress {
  id: string;
  house_leader_id: string;
  family_id: string;
  academic_year: string;
  total_hours: number | null;
  total_interactions: number | null;
  last_interaction_date?: string | null;
  created_at: string;
  updated_at: string;
}

export type InteractionCategory = 
  | 'welcome_meeting'
  | 'fall_development' 
  | 'winter_friendship'
  | 'spring_planning'
  | 'summer_wrapup'
  | 'daily_interaction'
  | 'community_event'
  | 'problem_solving'
  | 'referral_moment';

export interface InteractionCategoryInfo {
  id: InteractionCategory;
  label: string;
  description: string;
  defaultDuration: number;
  color: string;
  emoji: string;
}

export const INTERACTION_CATEGORIES: InteractionCategoryInfo[] = [
  {
    id: 'welcome_meeting',
    label: 'Welcome Meeting',
    description: 'Getting to know the family, expectations, goals',
    defaultDuration: 90,
    color: 'bg-green-100 text-green-800 border-green-200',
    emoji: '🟢'
  },
  {
    id: 'fall_development',
    label: 'Fall Development Chat',
    description: 'First progress update, early successes',
    defaultDuration: 60,
    color: 'bg-green-100 text-green-800 border-green-200',
    emoji: '🟢'
  },
  {
    id: 'winter_friendship',
    label: 'Winter Friendship Meeting',
    description: 'Community building, personal connection',
    defaultDuration: 90,
    color: 'bg-green-100 text-green-800 border-green-200',
    emoji: '🟢'
  },
  {
    id: 'spring_planning',
    label: 'Spring Planning',
    description: 'Future planning, next year discussion',
    defaultDuration: 60,
    color: 'bg-green-100 text-green-800 border-green-200',
    emoji: '🟢'
  },
  {
    id: 'summer_wrapup',
    label: 'Summer Wrap-up',
    description: 'Year reflection, relationship deepening',
    defaultDuration: 90,
    color: 'bg-green-100 text-green-800 border-green-200',
    emoji: '🟢'
  },
  {
    id: 'daily_interaction',
    label: 'Daily Interaction',
    description: 'Quick morning/afternoon chats during pickup/dropoff',
    defaultDuration: 2,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    emoji: '🔵'
  },
  {
    id: 'community_event',
    label: 'Community Event',
    description: 'Family program participation, school celebrations',
    defaultDuration: 20,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    emoji: '🟡'
  },
  {
    id: 'problem_solving',
    label: 'Problem Solving',
    description: 'Addressing parent concerns, quick issue resolution',
    defaultDuration: 12,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    emoji: '🟠'
  },
  {
    id: 'referral_moment',
    label: 'Referral Moment',
    description: 'Parent mentions friends, discussions about recommending UTR',
    defaultDuration: 7,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    emoji: '🟣'
  }
];

export const getCategoryInfo = (category: InteractionCategory): InteractionCategoryInfo => {
  return INTERACTION_CATEGORIES.find(c => c.id === category) || INTERACTION_CATEGORIES[0];
};

export const YEARLY_GOAL_HOURS = 15;
export const YEARLY_GOAL_MINUTES = YEARLY_GOAL_HOURS * 60; // 900 minutes
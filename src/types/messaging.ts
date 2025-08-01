export interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'file' | 'system';
  thread_id: string;
  created_at: string;
  updated_at: string;
  edited_at?: string | null;
  is_edited: boolean;
  parent_message_id?: string | null;
  sender?: {
    name: string | null;
    email: string | null;
    profile_type: string | null;
  };
}

export interface MessageThread {
  id: string;
  title?: string | null;
  thread_type: 'direct' | 'team' | 'group';
  team_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  team?: {
    name: string;
  };
  created_by_profile?: {
    name: string | null;
    email: string | null;
  };
}

export interface ThreadParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  joined_at: string;
  last_read_at?: string | null;
  is_muted: boolean;
  user?: {
    name: string | null;
    email: string | null;
    profile_type: string | null;
  };
}

export interface MessageParticipant {
  id: string;
  message_id: string;
  participant_id: string;
  participant_type: 'user' | 'team';
  team_id?: string | null;
  read_at?: string | null;
  created_at: string;
}
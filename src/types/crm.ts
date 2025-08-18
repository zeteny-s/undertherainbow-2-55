export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  status: 'active' | 'inactive' | 'prospect';
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Lead {
  id: string;
  customer_id: string;
  title: string;
  description?: string | null;
  status: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  source: 'website' | 'referral' | 'cold_call' | 'social_media' | 'other';
  value?: number | null;
  probability: number;
  expected_close_date?: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string;
  customer?: Customer;
}

export interface Deal {
  id: string;
  lead_id?: string | null;
  customer_id: string;
  title: string;
  amount: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expected_close_date?: string | null;
  actual_close_date?: string | null;
  created_at: string;
  updated_at: string;
  assigned_to: string;
  customer?: Customer;
  lead?: Lead;
}

export interface CRMActivity {
  id: string;
  customer_id?: string | null;
  lead_id?: string | null;
  deal_id?: string | null;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  created_by: string;
}
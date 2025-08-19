export interface CRMCustomer {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  status: 'active' | 'inactive' | 'prospect';
  source?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CRMLead {
  id: string;
  user_id: string;
  customer_id?: string | null;
  title: string;
  description?: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  source?: string | null;
  value: number;
  probability: number;
  expected_close_date?: string | null;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
  customer?: CRMCustomer;
}

export interface CRMDeal {
  id: string;
  user_id: string;
  lead_id?: string | null;
  customer_id: string;
  title: string;
  description?: string | null;
  amount: number;
  status: 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  close_date?: string | null;
  probability: number;
  created_at: string;
  updated_at: string;
  customer?: CRMCustomer;
  lead?: CRMLead;
}

export interface CRMAnalytics {
  totalCustomers: number;
  activeLeads: number;
  totalDeals: number;
  dealValue: number;
  conversionRate: number;
  monthlyRevenue: number;
  customersByStatus: {
    active: number;
    inactive: number;
    prospect: number;
  };
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    proposal: number;
    won: number;
    lost: number;
  };
  dealsByStatus: {
    proposal: number;
    negotiation: number;
    closed_won: number;
    closed_lost: number;
  };
}
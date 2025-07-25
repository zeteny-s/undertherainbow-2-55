export interface Invoice {
  id: string;
  file_name: string;
  file_url: string | null;
  organization: string;
  uploaded_at: string | null;
  processed_at?: string | null;
  status: string;
  amount?: number | null;
  invoice_date?: string | null;
  payment_deadline?: string | null;
  partner?: string | null;
  bank_account?: string | null;
  subject?: string | null;
  invoice_number?: string | null;
  payment_method?: string | null;
  invoice_type?: string | null;
  category?: string | null;
  munkaszam?: string | null;
  extracted_text?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface InvoiceData {
  partner: string;
  bankszamlaszam: string;
  targy: string;
  szamlaSorszama: string;
  osszeg: number;
  szamlaKelte: Date;
  fizetesiHatarido: Date;
  fizetesModja: string;
  invoiceType: 'bank_transfer' | 'card_cash_afterpay';
}

export interface Stats {
  totalInvoices: number;
  totalAmount: number;
  alapitvanyCount: number;
  ovodaCount: number;
  bankTransferCount: number;
  cardCashCount: number;
  thisMonthCount: number;
  pendingCount: number;
}
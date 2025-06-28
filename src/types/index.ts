export interface Invoice {
  id: string;
  fileName: string;
  fileUrl: string;
  organization: 'alapitvany' | 'ovoda';
  uploadedAt: Date;
  processedAt?: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  extractedData?: InvoiceData;
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
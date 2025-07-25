import { Invoice, Stats } from '../types';

export const mockStats: Stats = {
  totalInvoices: 347,
  totalAmount: 15678432,
  alapitvanyCount: 201,
  ovodaCount: 146,
  bankTransferCount: 298,
  cardCashCount: 49,
  thisMonthCount: 23,
  pendingCount: 5
};

export const mockRecentInvoices: Invoice[] = [
  {
    id: '1',
    file_name: 'szamla_energia_2024_01.pdf',
    file_url: '#',
    organization: 'alapitvany',
    uploaded_at: '2024-01-15T10:30:00',
    processed_at: '2024-01-15T10:32:00',
    status: 'completed',
    amount: 89500,
    invoice_date: '2024-01-10',
    payment_deadline: '2024-01-25',
    partner: 'E.ON Hungária Zrt.',
    bank_account: '12345678-12345678',
    subject: 'Villamosenergia szállítás',
    invoice_number: 'EN2024/001234',
    payment_method: 'Banki átutalás',
    invoice_type: 'bank_transfer',
    created_at: '2024-01-15T10:30:00',
    updated_at: '2024-01-15T10:32:00'
  },
  {
    id: '2',
    file_name: 'irodaszer_beszerzés_202401.jpg',
    file_url: '#',
    organization: 'ovoda',
    uploaded_at: '2024-01-14T14:20:00',
    processed_at: '2024-01-14T14:22:00',
    status: 'completed',
    amount: 23450,
    invoice_date: '2024-01-12',
    payment_deadline: '2024-01-27',
    partner: 'Office Depot Kft.',
    bank_account: '98765432-98765432',
    subject: 'Irodai kellékek',
    invoice_number: 'OD2024/5678',
    payment_method: 'Készpénz',
    invoice_type: 'card_cash_afterpay',
    created_at: '2024-01-14T14:20:00',
    updated_at: '2024-01-14T14:22:00'
  },
  {
    id: '3',
    file_name: 'karbantartas_szamla.pdf',
    file_url: '#',
    organization: 'alapitvany',
    uploaded_at: '2024-01-13T09:15:00',
    status: 'processing',
    created_at: '2024-01-13T09:15:00',
    updated_at: '2024-01-13T09:15:00'
  },
  {
    id: '4',
    file_name: 'etkeztetes_202401.png',
    file_url: '#',
    organization: 'ovoda',
    uploaded_at: '2024-01-12T16:45:00',
    status: 'uploaded',
    created_at: '2024-01-12T16:45:00',
    updated_at: '2024-01-12T16:45:00'
  }
];
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
    fileName: 'szamla_energia_2024_01.pdf',
    fileUrl: '#',
    organization: 'alapitvany',
    uploadedAt: new Date('2024-01-15T10:30:00'),
    processedAt: new Date('2024-01-15T10:32:00'),
    status: 'completed',
    extractedData: {
      partner: 'E.ON Hungária Zrt.',
      bankszamlaszam: '12345678-12345678',
      targy: 'Villamosenergia szállítás',
      szamlaSorszama: 'EN2024/001234',
      osszeg: 89500,
      szamlaKelte: new Date('2024-01-10'),
      fizetesiHatarido: new Date('2024-01-25'),
      fizetesModja: 'Banki átutalás',
      invoiceType: 'bank_transfer'
    }
  },
  {
    id: '2',
    fileName: 'irodaszer_beszerzés_202401.jpg',
    fileUrl: '#',
    organization: 'ovoda',
    uploadedAt: new Date('2024-01-14T14:20:00'),
    processedAt: new Date('2024-01-14T14:22:00'),
    status: 'completed',
    extractedData: {
      partner: 'Office Depot Kft.',
      bankszamlaszam: '98765432-98765432',
      targy: 'Irodai kellékek',
      szamlaSorszama: 'OD2024/5678',
      osszeg: 23450,
      szamlaKelte: new Date('2024-01-12'),
      fizetesiHatarido: new Date('2024-01-27'),
      fizetesModja: 'Készpénz',
      invoiceType: 'card_cash_afterpay'
    }
  },
  {
    id: '3',
    fileName: 'karbantartas_szamla.pdf',
    fileUrl: '#',
    organization: 'alapitvany',
    uploadedAt: new Date('2024-01-13T09:15:00'),
    status: 'processing'
  },
  {
    id: '4',
    fileName: 'etkeztetes_202401.png',
    fileUrl: '#',
    organization: 'ovoda',
    uploadedAt: new Date('2024-01-12T16:45:00'),
    status: 'uploaded'
  }
];
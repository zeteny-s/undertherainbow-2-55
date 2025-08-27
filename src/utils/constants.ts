export const INVOICE_CATEGORIES = [
  'Bérleti díjak',
  'Közüzemi díjak',
  'Szolgáltatások',
  'Étkeztetés költségei',
  'Személyi jellegű kifizetések',
  'Anyagköltség',
  'Tárgyi eszközök',
  'Felújítás, beruházások',
  'Egyéb'
] as const;

export const INVOICE_STATUSES = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error'
} as const;

export const PAYMENT_TYPES = {
  BANK_TRANSFER: 'bank_transfer',
  CARD_CASH_AFTERPAY: 'card_cash_afterpay'
} as const;

export const ORGANIZATIONS = {
  ALAPITVANY: 'alapitvany',
  OVODA: 'ovoda'
} as const;

export const PROFILE_TYPES = {
  ADMINISZTRACIO: 'adminisztracio',
  PEDAGOGUS: 'pedagogus',
  HAZ_VEZETO: 'haz_vezeto',
  VEZETOI: 'vezetoi'
} as const;
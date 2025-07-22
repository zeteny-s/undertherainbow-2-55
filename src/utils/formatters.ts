export const formatCurrency = (amount: number): string => {
  if (!amount) return '0 Ft';
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};
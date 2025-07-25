

interface ParsedInvoiceData {
  partner?: string;
  bankszamlaszam?: string;
  targy?: string;
  szamlaSorszama?: string;
  osszeg?: number;
  szamlaKelte?: Date;
  fizetesiHatarido?: Date;
  fizetesModja?: string;
  invoiceType?: 'bank_transfer' | 'card_cash_afterpay';
}

export function parseInvoiceText(text: string): ParsedInvoiceData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const result: ParsedInvoiceData = {};

  // Partner detection (vendor/supplier)
  const partnerKeywords = ['eladó', 'szállító', 'szolgáltató', 'partner', 'cég', 'kft', 'zrt', 'bt', 'kkt'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (partnerKeywords.some(keyword => line.includes(keyword)) && i + 1 < lines.length) {
      result.partner = lines[i + 1];
      break;
    }
  }

  // Bank account number detection
  const bankAccountRegex = /\d{8}-\d{8}(-\d{8})?/;
  for (const line of lines) {
    const match = line.match(bankAccountRegex);
    if (match) {
      result.bankszamlaszam = match[0];
      break;
    }
  }

  // Invoice number detection
  const invoiceNumberKeywords = ['számla sorszáma', 'számlaszám', 'bizonylatszám', 'sorszám'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (invoiceNumberKeywords.some(keyword => line.includes(keyword))) {
      // Look for the number in the same line or next line
      const numberMatch = lines[i].match(/[A-Z0-9\/\-]+$/);
      if (numberMatch) {
        result.szamlaSorszama = numberMatch[0];
      } else if (i + 1 < lines.length) {
        result.szamlaSorszama = lines[i + 1];
      }
      break;
    }
  }

  // Amount detection (Hungarian currency format)
  const amountRegex = /(\d{1,3}(?:\s?\d{3})*(?:,\d{2})?)\s*(?:ft|huf|forint)/i;
  for (const line of lines) {
    const match = line.match(amountRegex);
    if (match) {
      const amountStr = match[1].replace(/\s/g, '').replace(',', '.');
      result.osszeg = parseFloat(amountStr);
      break;
    }
  }

  // Date detection
  const dateRegex = /(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/;
  const dateKeywords = ['számla kelte', 'kiállítás dátuma', 'dátum'];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (dateKeywords.some(keyword => line.includes(keyword))) {
      const dateMatch = lines[i].match(dateRegex) || (i + 1 < lines.length ? lines[i + 1].match(dateRegex) : null);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        result.szamlaKelte = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        break;
      }
    }
  }

  // Payment deadline detection
  const deadlineKeywords = ['fizetési határidő', 'esedékesség', 'teljesítés határideje'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (deadlineKeywords.some(keyword => line.includes(keyword))) {
      const dateMatch = lines[i].match(dateRegex) || (i + 1 < lines.length ? lines[i + 1].match(dateRegex) : null);
      if (dateMatch) {
        const [, year, month, day] = dateMatch;
        result.fizetesiHatarido = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        break;
      }
    }
  }

  // Payment method detection
  const paymentMethods = {
    'bank_transfer': ['banki átutalás', 'átutalás', 'csoportos beszedés', 'utalás'],
    'card_cash_afterpay': ['készpénz', 'kártya', 'utánvét', 'bankkártya', 'cash']
  };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const [type, keywords] of Object.entries(paymentMethods)) {
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        result.fizetesModja = line;
        result.invoiceType = type as 'bank_transfer' | 'card_cash_afterpay';
        break;
      }
    }
    if (result.fizetesModja) break;
  }

  // Subject/description detection (usually first item or service description)
  const subjectKeywords = ['tárgy', 'megnevezés', 'szolgáltatás', 'termék'];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (subjectKeywords.some(keyword => line.includes(keyword)) && i + 1 < lines.length) {
      result.targy = lines[i + 1];
      break;
    }
  }

  // If no subject found, try to find the first meaningful description
  if (!result.targy) {
    for (const line of lines) {
      if (line.length > 10 && !line.match(/\d{4}[.\-\/]\d{1,2}[.\-\/]\d{1,2}/) && !line.match(/\d+\s*ft/i)) {
        result.targy = line;
        break;
      }
    }
  }

  return result;
}
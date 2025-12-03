export const generateWhatsAppLink = (
  phone: string,
  predefinedText?: string,
  fallbackCountryCode: string = '591'
): string => {
  const raw = String(phone || '').trim();
  if (!raw) return '';

  const hasPlus = /^\s*\+/.test(raw);
  const hasDoubleZero = /^\s*00/.test(raw);

  let formatted = raw.replace(/\D/g, '');
  if (!formatted) return '';

  const cleanFallback = String(fallbackCountryCode).replace(/\D/g, '') || '591';

  if (hasPlus) {
    formatted = formatted;
  } else if (hasDoubleZero) {
    formatted = formatted.replace(/^00/, '');
  } else {
    const startsWithFallback = formatted.startsWith(cleanFallback);
    const isUSFormat = formatted.startsWith('1') && formatted.length === 11;
    const isBoliviaLocal = formatted.length === 8;

    if (startsWithFallback) {
    } else if (isUSFormat) {
    } else if (isBoliviaLocal) {
      formatted = `${cleanFallback}${formatted}`;
    } else {
      if (formatted.length <= 9) {
        formatted = `${cleanFallback}${formatted}`;
      }
    }
  }

  const baseUrl = `https://wa.me/${formatted}`;
  const query = predefinedText ? `?text=${encodeURIComponent(predefinedText)}` : '';
  return `${baseUrl}${query}`;
};

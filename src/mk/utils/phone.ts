export const generateWhatsAppLink = (phone: string, predefinedText?: string): string => {
  const clean = String(phone || '').replace(/\D/g, '');
  if (!clean) return '';
  const startsWith591 = clean.startsWith('591');
  const formatted = clean.length <= 8 ? (startsWith591 ? clean : `591${clean}`) : clean;
  const textParam = predefinedText ? `&text=${encodeURIComponent(predefinedText)}` : '';
  return `https://api.whatsapp.com/send?phone=${formatted}${textParam}`;
};

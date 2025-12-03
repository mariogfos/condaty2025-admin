const COUNTRY_CODES = new Set([
  '1', '7', '20', '27', '30', '31', '32', '33', '34', '39', '40',
  '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53',
  '54', '55', '56', '57', '58', '60', '61', '62', '63', '64', '65',
  '66', '81', '82', '84', '86', '90', '91', '92', '93', '94', '95',
  '98', '212', '213', '216', '218', '220', '221', '222', '223', '224',
  '225', '226', '227', '228', '229', '230', '231', '232', '233', '234',
  '235', '236', '237', '238', '239', '240', '241', '242', '243', '244',
  '245', '246', '248', '249', '250', '251', '252', '253', '254', '255',
  '256', '257', '258', '260', '261', '262', '263', '264', '265', '266',
  '267', '268', '269', '290', '291', '297', '298', '299', '350', '351',
  '352', '353', '354', '355', '356', '357', '358', '359', '370', '371',
  '372', '373', '374', '375', '376', '377', '378', '380', '381', '382',
  '383', '385', '386', '387', '389', '420', '421', '423', '500', '501',
  '502', '503', '504', '505', '506', '507', '508', '509', '590', '591',
  '592', '593', '594', '595', '596', '597', '598', '599', '670', '672',
  '673', '674', '675', '676', '677', '678', '679', '680', '681', '682',
  '683', '685', '686', '687', '688', '689', '690', '691', '692', '850',
  '852', '853', '855', '856', '880', '886', '960', '961', '962', '963',
  '964', '965', '966', '967', '968', '970', '971', '972', '973', '974',
  '975', '976', '977', '992', '993', '994', '995', '996', '998'
]);

const LOCAL_PHONE_LENGTHS: Record<string, number[]> = {
  '591': [8],
  '1': [10],
  '52': [10],
  '54': [10, 11],
  '55': [10, 11],
  '56': [9],
  '57': [10],
  '51': [9],
  '34': [9],
  '33': [9, 10],
  '44': [10],
  '49': [10, 11],
  '593': [9],
  '595': [9],
  '598': [8, 9]
};

interface PhoneParseResult {
  countryCode: string;
  nationalNumber: string;
  fullNumber: string;
  isValid: boolean;
}

function hasCountryCode(digits: string): string | null {
  for (let len = 4; len >= 1; len--) {
    const potentialCode = digits.substring(0, len);
    if (COUNTRY_CODES.has(potentialCode)) {
      return potentialCode;
    }
  }
  return null;
}

function isValidNationalLength(countryCode: string, nationalNumber: string): boolean {
  const validLengths = LOCAL_PHONE_LENGTHS[countryCode];
  if (!validLengths) return true;
  return validLengths.includes(nationalNumber.length);
}

function parsePhoneNumber(
  phone: string,
  fallbackCountryCode: string = '591'
): PhoneParseResult {
  const raw = String(phone || '').trim();
  const hasPlus = /^\s*\+/.test(raw);
  const hasDoubleZero = /^\s*00/.test(raw);

  let digits = raw.replace(/\D/g, '');

  if (!digits) {
    return {
      countryCode: '',
      nationalNumber: '',
      fullNumber: '',
      isValid: false
    };
  }

  let countryCode = '';
  let nationalNumber = '';

  if (hasPlus || hasDoubleZero) {
    if (hasDoubleZero) {
      digits = digits.replace(/^00/, '');
    }

    const detectedCode = hasCountryCode(digits);
    if (detectedCode) {
      countryCode = detectedCode;
      nationalNumber = digits.substring(detectedCode.length);
    } else {
      countryCode = '';
      nationalNumber = digits;
    }
  } else {
    const detectedCode = hasCountryCode(digits);

    if (detectedCode) {
      const potentialNational = digits.substring(detectedCode.length);

      if (isValidNationalLength(detectedCode, potentialNational)) {
        countryCode = detectedCode;
        nationalNumber = potentialNational;
      } else {
        countryCode = fallbackCountryCode;
        nationalNumber = digits;
      }
    } else {
      countryCode = fallbackCountryCode;
      nationalNumber = digits;
    }
  }

  const fullNumber = countryCode ? `${countryCode}${nationalNumber}` : nationalNumber;
  const isValid = fullNumber.length >= 7;

  return {
    countryCode,
    nationalNumber,
    fullNumber,
    isValid
  };
}

export const generateWhatsAppLink = (
  phone: string,
  predefinedText?: string,
  fallbackCountryCode: string = '591'
): string => {
  const cleanFallback = String(fallbackCountryCode).replace(/\D/g, '') || '591';
  const parsed = parsePhoneNumber(phone, cleanFallback);

  if (!parsed.isValid) {
    return '';
  }

  const baseUrl = `https://wa.me/${parsed.fullNumber}`;
  const query = predefinedText ? `?text=${encodeURIComponent(predefinedText)}` : '';

  return `${baseUrl}${query}`;
};

export const getPhoneInfo = (
  phone: string,
  fallbackCountryCode: string = '591'
): PhoneParseResult => {
  const cleanFallback = String(fallbackCountryCode).replace(/\D/g, '') || '591';
  return parsePhoneNumber(phone, cleanFallback);
};

/**
 * Utility functions for Ukrainian phone masking and e-commerce formatting
 */

export function formatUaPhone(input: string): string {
  // Strip everything except digits
  let digits = input.replace(/\D/g, '');

  if (digits.startsWith('380')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('80') && digits.length >= 11) {
    digits = digits.slice(2);
  } else if (digits.startsWith('38') && digits.length >= 11) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Max 9 digits for UA phone numbers (e.g. 99 123 45 67)
  digits = digits.slice(0, 9);

  if (!digits) return '';
  if (digits.length <= 2) return `+380 (${digits}`;
  if (digits.length <= 5) return `+380 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `+380 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5)}`;
  return `+380 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7)}`;
}

export function normalizeUaPhoneForAnalytics(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '38' + digits;
  } else if (!digits.startsWith('380') && digits.length === 9) {
    digits = '380' + digits;
  }
  return digits ? `+${digits}` : '';
}

export const POPULAR_UA_CITIES = [
  'Київ',
  'Харків',
  'Одеса',
  'Дніпро',
  'Львів',
  'Запоріжжя',
  'Кривий Ріг',
  'Миколаїв',
  'Вінниця',
  'Полтава',
  'Чернігів',
  'Черкаси',
  'Житомир',
  'Суми',
  'Хмельницький',
  'Рівне',
  'Івано-Франківськ',
  'Тернопіль',
  'Луцьк',
  'Ужгород',
  'Чернівці',
];

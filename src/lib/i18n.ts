import en from '@/locales/en.json';
import ur from '@/locales/ur.json';

export const translations = {
  en,
  ur,
};

export type Locale = 'en' | 'ur';
export type TranslationKey = keyof typeof ur;

import type { MenuOrderLanguage } from '@shared/api';
import type { Dish } from '@shared/menu';

export interface MenuOrderPhrase {
  lang: MenuOrderLanguage;
  languageLabel: string;
  textLocal: string;
  textEnglish: string;
}

const LANGUAGE_LABELS: Record<MenuOrderLanguage, string> = {
  ms: 'Bahasa Melayu',
  yue: '廣東話 · Cantonese',
  zh: '普通话 · Mandarin',
};

export function menuOrderPhrase(dish: Dish, lang: MenuOrderLanguage): MenuOrderPhrase {
  const dishName = dish.name_local.trim();
  const textEnglish = `Boss, one ${dish.name_english}, please.`;
  const textLocal = lang === 'ms'
    ? normalizeMalayPhrase(dish.order_phrase, dishName)
    : lang === 'yue'
      ? `老闆，唔該畀我一份${dishName}。`
      : `老板，我要一份${dishName}，谢谢。`;
  return { lang, languageLabel: LANGUAGE_LABELS[lang], textLocal, textEnglish };
}

function normalizeMalayPhrase(existing: string, dishName: string): string {
  const phrase = existing.trim();
  if (phrase.length >= 8) return phrase;
  return `Bos, saya nak satu ${dishName}, ya. Terima kasih.`;
}

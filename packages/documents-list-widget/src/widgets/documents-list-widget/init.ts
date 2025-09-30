import {setLocale} from '@lib/i18n/i18n'

export function initTranslations(locale: string, translationModules: Record<string, { default: Record<string, string>; locale: string }>) {
  const translations: Record<string, Record<string, string>> = {};

  Object.values(translationModules).forEach((module) => {
    if (module.locale) {
      translations[module.locale] = module.default;
    }
  });

  if (translations[locale]) {
    setLocale(locale, translations);
  } else if (locale !== 'en') {
    // eslint-disable-next-line no-console
    console.warn(`DocumentListWidget: No translations found for locale: ${locale}`);
  }
}

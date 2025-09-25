import {setLocale} from '@lib/i18n/i18n'

const LOCALE_MATCH_INDEX = 2;

function getTranslations(translationsModules: Record<string, { [key: string]: string }>) {
  const translations: Record<string, Record<string, string>> = {};

  Object.entries(translationsModules).forEach(([path, module]) => {
    // Extract locale from filename (e.g., '../../translations/youtrack-issues-list-widget_ru.po' -> 'ru')
    const match = path.match(/\/([^/]+)_(\w+)\.po$/);
    if (match) {
      const locale = match[LOCALE_MATCH_INDEX];
      const moduleWithDefault = module as { default?: Record<string, string> };
      translations[locale] = moduleWithDefault.default || {};
    }
  });
  return translations;
}

export function initTranslations(locale: string, translationFiles: Record<string, Record<string, string>>) {
  const translations = getTranslations(translationFiles);

  if (translations[locale]) {
    setLocale(locale, translations);
  } else if (locale !== 'en') {
    // eslint-disable-next-line no-console
    console.warn(`DocumentListWidget: No translations found for locale: ${locale}`);
  }
}

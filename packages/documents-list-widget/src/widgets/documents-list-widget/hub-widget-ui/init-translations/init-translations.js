import {setLocale} from 'hub-dashboard-addons/dist/localization';

const getTranslations = translationFiles =>
  translationFiles.keys().
    reduce((result, fileKey) => {
      const lang = fileKey.split('.po')[0].split('_')[1];
      const fileJson = translationFiles(fileKey);
      result[lang] = Object.keys(fileJson).
        reduce(
          (accumulator, propertyKey) =>
            ({...accumulator, ...fileJson[propertyKey]}),
          {}
        );
      return result;
    }, {});

export function initTranslations(locale, translationFiles) {
  const translations = getTranslations(translationFiles);
  if (translations[locale]) {
    setLocale(locale, translations);
  }
}

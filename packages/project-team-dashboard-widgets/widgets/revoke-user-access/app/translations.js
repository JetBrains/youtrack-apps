import {setLocale} from 'hub-dashboard-addons/dist/localization';

const translationFiles = require.context('./translations/', true, /\.po$/);

const translations = translationFiles.keys().
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

export function initTranslations(locale) {
  if (translations[locale]) {
    setLocale(locale, translations);
  }
}

type PluralsFunction = (n: number) => number;
type TranslationValue = string | string[];
type ContextualTranslation = Record<string, TranslationValue>;
type Dictionary = Record<string, TranslationValue | ContextualTranslation>;

/**
 * Taken from https://github.com/JetBrains/hub-dashboard-addons/blob/master/components/localization/src/localization.js
 */

class I18n {
  static GET_PLURALS_MAP: Record<string, PluralsFunction> = {
    ru: (n: number): number => {
      if (n % 10 === 1 && n % 100 !== 11) {
        return 0;
      }
      return (n % 10 >= 2) && (n % 10 <= 4) && (n % 100 < 10 || n % 100 >= 20)
        ? 1
        : 2;
    },
    fr: (n: number): number => (n > 1 ? 1 : 0),
    ja: (): number => 0,

    OTHERS: (n: number): number => (n !== 1 ? 1 : 0)
  };

  static DEFAULT_CONTEXT = '$$noContext';

  private dictionary: Dictionary;
  private getPlurals: PluralsFunction;

  constructor() {
    this.dictionary = {};
    this.getPlurals = I18n.GET_PLURALS_MAP.OTHERS!;
  }

  setTranslations(lang: string, dictionary?: Dictionary): void {
    this.dictionary = dictionary || {};
    this.getPlurals = I18n.GET_PLURALS_MAP[lang] ?? I18n.GET_PLURALS_MAP.OTHERS!;
  }

  interpolate(text: string, interpolationObject?: Record<string, string | number>): string {
    if (!interpolationObject || !Object.keys(interpolationObject).length) {
      return text;
    }
    const substringsForReplacing =
      getSubstringsForReplacing(text, interpolationObject);
    let resultText = text;
    Object.keys(substringsForReplacing).forEach(key => {
      if (substringsForReplacing[key] !== undefined) {
        resultText = resultText.replace(key, String(substringsForReplacing[key]));
      }
    });
    return resultText;

    function getSubstringsForReplacing(str: string, interpolationValues: Record<string, string | number>): Record<string, string | number> {
      let currentInterpolatedFragmentStart = -1;
      const substringToValueMap: Record<string, string | number> = {};
      for (let i = 0; i < (str.length - 1); ++i) {
        if (str[i] === '{' && str[i + 1] === '{') {
          currentInterpolatedFragmentStart = i + 2;
          i = currentInterpolatedFragmentStart;
        } else if (str[i] === '}' && str[i + 1] === '}' &&
          currentInterpolatedFragmentStart > 0) {
          const variableName = str.substring(
            currentInterpolatedFragmentStart, i
          );
          const value = interpolationValues[variableName.trim()];
          if (value !== undefined) {
            substringToValueMap[`{{${variableName}}}`] = value;
          }
        }
      }
      return substringToValueMap;
    }
  }

  getTranslationString(text: string, numberForPlurals?: number, context?: string): string | undefined {
    const contexts = this.dictionary[text];
    if (!contexts) {
      return undefined;
    }

    if (typeof contexts === 'string' || Array.isArray(contexts)) {
      // Direct translation value or array of plurals
      if (typeof contexts === 'string') {
        return contexts;
      }
      if (Array.isArray(contexts)) {
        const pluralFormId = this.getPlurals(
          Number.isInteger(numberForPlurals) ? numberForPlurals! : 1
        );
        return contexts[pluralFormId];
      }
    } else {
      // Contextual translation object
      const currentTranslation = contexts[context || I18n.DEFAULT_CONTEXT] || contexts;
      if (typeof currentTranslation === 'string') {
        return currentTranslation;
      }
      if (Array.isArray(currentTranslation)) {
        const pluralFormId = this.getPlurals(
          Number.isInteger(numberForPlurals) ? numberForPlurals! : 1
        );
        return currentTranslation[pluralFormId];
      }
    }
    return undefined;
  }

  translate(text: string, interpolationObject?: Record<string, string | number>, numberForPlurals?: number, context?: string): string {
    const currentTranslation = this.getTranslationString(
      text, numberForPlurals, context
    );
    return this.interpolate(
      currentTranslation || text, interpolationObject
    );
  }

  translatePlural(
    count: number, textForUnique: string, textForPlural: string, interpolationObject?: Record<string, string | number>, context?: string
  ): string {
      debugger
    const currentTranslation = this.getTranslationString(
      textForUnique,
      count,
      context
    );
    const stringToInterpolate = currentTranslation ||
      (count === 1 ? textForUnique : textForPlural);
    return this.interpolate(
      stringToInterpolate,
      Object.assign({$count: count}, interpolationObject || {})
    );
  }
}

const I18N_INSTANCE = new I18n();

type I18nFunction = {
  (text: string, interpolationObject?: Record<string, string | number>, numberForPlurals?: number, context?: string): string;
  plural: (count: number, textForUnique: string, textForPlural: string, interpolationObject?: Record<string, string | number>, context?: string) => string;
};

export const i18n = I18N_INSTANCE.translate.bind(I18N_INSTANCE) as I18nFunction;
i18n.plural = I18N_INSTANCE.translatePlural.bind(I18N_INSTANCE);

// Declare fecha interface to avoid type errors
interface FechaI18n {
  dayNamesShort: string[];
  dayNames: string[];
  monthNamesShort: string[];
  monthNames: string[];
  amPm: string[];
}

interface FechaMasks {
  datePresentation: string;
  dateAndTimePresentation: string;
}

interface Fecha {
  i18n: FechaI18n;
  masks: FechaMasks;
}

// @deprecated Use another date library
export function configureFecha(fecha: Fecha): void {
  if (typeof fecha !== 'undefined') {
    fecha.i18n.dayNamesShort = i18n('Sun|Mon|Tue|Wed|Thu|Fri|Sat').split('|');
    fecha.i18n.dayNames = i18n('Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday').split('|');
    fecha.i18n.monthNamesShort = i18n('Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec').split('|');
    fecha.i18n.monthNames = i18n('January|February|March|April|May|June|July|August|September|October|November|December').split('|');
    fecha.i18n.amPm = i18n('am|pm').split('|');
    fecha.masks.datePresentation = 'DD MMM YYYY';
    fecha.masks.dateAndTimePresentation = 'DD MMM YYYY HH:MM';
  }
}

export function setLocale(lang: string, translations: Record<string, unknown>): void {
  I18N_INSTANCE.setTranslations(lang, translations[lang] as Dictionary);
}

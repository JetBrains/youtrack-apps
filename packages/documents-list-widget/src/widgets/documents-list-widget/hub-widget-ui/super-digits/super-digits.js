/* eslint-disable no-magic-numbers */
const unicodeSuperscriptDigits = [
  '\u2070', '\u00B9', '\u00B2', '\u00B3', '\u2074',
  '\u2075', '\u2076', '\u2077', '\u2078', '\u2079'
];

/**
 * Converts number to super digits string
 *
 * @param {number} number - number to render
 * @return {string} textual presentation of the number in super script
 */
export default function toSuperDigitsString(number) {
  const digits = [];
  const isNegative = number < 0;
  let rest = Math.abs(Math.round(number));
  do {
    digits.push(rest % 10);
    rest = Math.floor(rest / 10);
  } while (rest > 0);

  const absoluteText = digits.
    reverse().
    map(it => unicodeSuperscriptDigits[it]).
    join('');

  if (isNegative) {
    return `\u207B${absoluteText}`;
  } else {
    return absoluteText;
  }
}

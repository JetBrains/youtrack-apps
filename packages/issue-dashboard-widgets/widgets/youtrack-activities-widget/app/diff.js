import {diff_match_patch as Dmp} from 'diff_match_patch';

// copy paste from YT codebase for diff changes
function newDifference() {
  const dmp = new Dmp();

  function diff(x, y) {
    return createDiff(x, y);
  }

  diff.format = (format, d) => {
    switch (format) {
      case 'unidiff':
        return unidiff(d.text1, d.text2, d.diff);
      case 'wdiff-html':
        return wdifHtml(d.diff);
      default:
        throw Error(`DiffError: Unknown format "${format}"`);
    }
  };
  return diff;

  function createDiff(text1, text2) {
    return {
      diff: diffWordMode(text1, text2),
      text1,
      text2
    };
  }

  function diffWordMode(text1, text2) {
    const a = diffWordsToChars(text1, text2);
    const lineText1 = a.chars1;
    const lineText2 = a.chars2;
    const lineArray = a.lineArray;
    const diffs = dmp.diff_main(lineText1, lineText2, false);
    // diff_charsToLines function works fine in word-mode
    dmp.diff_charsToLines(diffs, lineArray);
    dmp.diff_cleanupSemantic(diffs);
    return diffs;
  }


  // Split two texts into an array of strings. Reduce the texts to a string of
  // hashes where each Unicode character represents one word
  // @see https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs
  function diffWordsToChars(text1, text2) {
    const wordArray = [];
    const wordHash = {};
    const hasOwnProperty = Object.hasOwnProperty;

    // '\x00' is a valid character, but various debuggers don't like it.
    // So we'll insert a junk entry to avoid generating a null character.
    wordArray[0] = '';

    function encodeWordsToChars(text) {
      let chars = '';
      let wordStart = 0;
      let wordEnd = 0;
      let wordArrayLength = wordArray.length;
      const textEnd = text.length;
      const wb = /\B/;

      while (wordEnd < textEnd) {
        wordEnd = (!wb.test(text[wordStart])
          ? indexOf(text, wb, wordStart)
          : Math.min(wordEnd + 1, textEnd));

        if (wordEnd === -1) {
          wordEnd = textEnd;
        }


        const word = text.substring(wordStart, wordEnd);
        wordStart = wordEnd;

        if (!hasOwnProperty.call(wordHash, word)) {
          wordHash[word] = wordArrayLength;
          wordArray[wordArrayLength++] = word;
        }

        chars += String.fromCharCode(wordHash[word]);
      }

      return chars;
    }

    const chars1 = encodeWordsToChars(text1);
    const chars2 = encodeWordsToChars(text2);
    return {chars1, chars2, lineArray: wordArray};
  }


  function indexOf(str, regExp, fromIndex) {
    let index = fromIndex;
    while (index < str.length) {
      if (regExp.test(str[index])) {
        return index;
      }
      index++;
    }
    return -1;
  }

  function unidiff(text1, text2, difference) {
    return dmp.patch_make(text1, text2, difference).
      map(p => p.toString()).
      reduce((result, line) => result + line);
  }

  function wdifHtml(difference) {
    const DIFF_DELETE = -1;
    const DIFF_INSERT = 1;
    const DIFF_EQUAL = 0;

    const result = [];

    for (let x = 0; x < difference.length; x++) {
      const operation = difference[x][0];
      const text = escape(difference[x][1]);

      switch (operation) {
        case DIFF_INSERT:
          result[x] = `<ins class="diff-ins">${text}</ins>`;
          break;
        case DIFF_DELETE:
          result[x] = `<del class="diff-del">${text}</del>`;
          break;
        case DIFF_EQUAL:
          result[x] = `<span class="diff-eq">${text}</span>`;
          break;
        default:
      }
    }
    return result.join('');

    function escape(text) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }
  }
}

export default newDifference();

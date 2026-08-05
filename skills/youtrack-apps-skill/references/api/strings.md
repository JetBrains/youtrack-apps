# strings

This module provides support for a specific string utility from the standard Java library.
All of the other methods that you can use to work with strings in workflows are taken from the standard JavaScript library
and behave as described in the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).

## Functions

### getLevenshteinDistance

Returns the Levenshtein distance between two strings.
Delegates to [org.apache.commons.text.similarity.LevenshteinDistance](https://commons.apache.org/proper/commons-text/javadocs/api-release/org/apache/commons/text/similarity/LevenshteinDistance.html).

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `str1` | `string` | The first string. |
| `str2` | `string` | The string that is compared to the first string. |

### md5

Calculates the MD5 digest of a string and returns the value as a 32 character hex string.

Since: `2022.1`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `str` | `string` | String to digest. |

#### Returns

Return type: `string`.

Digested hex string.

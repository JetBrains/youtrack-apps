# date-time

This module contains functions that let you work with dates and times.

## Functions

### after

Returns a timestamp that represents a point in time after the specified period from the specified date.

Since: `2018.2.42881`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `timestamp` | `number`, `object`, `string` | The base date value. |
| `duration` | `number`, `string`, `Period` | A duration as a number (in milliseconds), string representation, or period as retrieved from a custom field or returned by the toPeriod() function. The string representation is a series of numeric values followed by the abbreviation that represents the timespan, in descending order. For example, 3w4d23h58m. |

#### Returns

Return type: `number`.

The resulting timestamp.

### before

Returns a timestamp that represents a point in time before the specified period from the specified date.

Since: `2018.2.42881`  

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `timestamp` | `number`, `object`, `string` | The base date value. |
| `duration` | `number`, `string`, `Period` | A duration as a number (in milliseconds), string representation, or period as retrieved from a custom field or returned by the toPeriod() function. The string representation is a series of numeric values followed by the abbreviation that represents the timespan, in descending order. For example, 3w4d23h58m. |

#### Returns

Return type: `number`.

The resulting timestamp.

### format

Creates a string representation of a Unix timestamp.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `timestamp` | `number`, `object`, `string` | The timestamp to format as a string. |
| `format` | `string` | The date format to apply to the output. If no value is specified, the date format is supplied by the system. For actions that are attributed to the current user, the date format setting from the profile for the current user is applied. For actions that are attributed to the workflow user account, the global date fields format setting is applied. For example, use `yyyy-MM-dd HH:mm` to show the year, month, day, hour, and minute, or `yyyy-MM-dd'T'HH:mm:ss.SSSZ` to include seconds, milliseconds, and a time zone offset. For format description, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/SimpleDateFormat.html. |
| `timeZoneId` | `string` | The ID of a time zone. Applies an offset to the original timestamp, which is in UTC. If no value is specified, the time zone is supplied by the system. For actions that are attributed to the current user, the local time zone setting from the profile for the current user is applied. For actions that are attributed to the workflow user account, the global default time zone is applied. For a list of time zone IDs, see [JodaTime](http://joda-time.sourceforge.net/timezones.html). |

#### Returns

Return type: `string`.

A string representation of the specified timestamp.

### parse

Parses a string representation of a date to return a Unix timestamp.
Use this method instead of the Date.parse() method from JavaScript.
For a detailed explanation, refer to the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse).

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `dateTimeString` | `string` | The string representation of a date. |
| `formats` | `string`, `Array.<string>` | A date format that possibly matches the dateTimeString or an array of formats. If an array is provided, the formats are applied sequentially until the dateTimeString is parsed successfully. If no value is specified, the date format is supplied by the system. For actions that are attributed to the current user, the date format setting from the profile for the current user is applied. For actions that are attributed to the workflow user account, the global date fields format setting is applied. For format description, see https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/SimpleDateFormat.html. |
| `timeZoneId` | `string` | The ID of a time zone in which the dateTimeString occurs. This parameter is only effective when the format that matches the string does not provide any timestamp information. If neither the format that successfully matches the string nor this parameter provide the time zone, the time zone is supplied by the system. For actions that are attributed to the current user, the local time zone setting from the profile for the current user is applied. For actions that are attributed to the workflow user account, the global default time zone is applied. For a list of time zone IDs, see [JodaTime](http://joda-time.sourceforge.net/timezones.html). |

#### Returns

Return type: `number`.

A timestamp representation of the specified string.

### toPeriod

Creates a period representation of an argument.

#### Parameters

| Name | Type | Description |
| --- | --- | --- |
| `period` | `number`, `string` | A duration in milliseconds as either a number or a string. The string representation is a series of numeric values followed by the abbreviation that represents the timespan, in descending order. For example, 3w4d23h58m. |

#### Returns

Return type: `Period`.

The period representation of the specified argument.

#### Examples

```javascript
issue.fields.Estimation = dateTime.toPeriod(3 * 3600 * 1000); // 3h in ms
issue.fields.Estimation = dateTime.toPeriod('3h'); // short form
issue.fields.Estimation = dateTime.toPeriod('2w4d3h15m'); // full form
```

#### See Also
- For possible usages, see PeriodProjectCustomField.

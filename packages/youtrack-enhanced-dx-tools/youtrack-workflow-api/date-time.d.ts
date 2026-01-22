/**
 * This module contains functions that let you work with dates and times.
 *
 * @module @jetbrains/youtrack-scripting-api/date-time
 */

/**
 * Represents a time period (e.g., "3h", "2w4d3h15m")
 */
export interface Period {
  getMillis(): number;
}

/**
 * Parses a string representation of a date to return a Unix timestamp.
 * Use this method instead of the Date.parse() method from JavaScript.
 * For a detailed explanation, refer to the {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse|MDN documentation}.
 *
 * @param dateTimeString The string representation of a date.
 *
 * @param formats A date format that possibly matches the dateTimeString or an array of formats.
 * If an array is provided, the formats are applied sequentially until the dateTimeString is parsed successfully.
 * If no value is specified, the date format is supplied by the system.
 * For actions that are attributed to the current user, the date format setting from the profile for the current user is applied.
 * For actions that are attributed to the workflow user account, the global date fields format setting is applied.
 * For format description, see {@link https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/SimpleDateFormat.html}.
 *
 * @param timeZoneId The ID of a time zone in which the dateTimeString occurs.
 * This parameter is only effective when the format that matches the string does not provide any timestamp information.
 * If neither the format that successfully matches the string nor this parameter provide the time zone, the time zone is supplied by the system.
 * For actions that are attributed to the current user, the local time zone setting from the profile for the current user is applied.
 * For actions that are attributed to the workflow user account, the global default time zone is applied.
 * For a list of time zone IDs, see {@link http://joda-time.sourceforge.net/timezones.html|JodaTime}.
 *
 * @return A timestamp representation of the specified string.
 */
export function parse(dateTimeString: string, formats?: string | string[], timeZoneId?: string): number;

/**
 * Creates a string representation of a Unix timestamp.
 *
 * @param timestamp The timestamp to format as a string.
 *
 * @param format The date format to apply to the output.
 * If no value is specified, the date format is supplied by the system.
 * For actions that are attributed to the current user, the date format setting from the profile for the current user is applied.
 * For actions that are attributed to the workflow user account, the global date fields format setting is applied.
 * For format description, see {@link https://docs.oracle.com/en/java/javase/11/docs/api/java.base/java/text/SimpleDateFormat.html}.
 *
 * @param timeZoneId The ID of a time zone.
 * Applies an offset to the original timestamp, which is in UTC.
 * If no value is specified, the time zone is supplied by the system.
 * For actions that are attributed to the current user, the local time zone setting from the profile for the current user is applied.
 * For actions that are attributed to the workflow user account, the global default time zone is applied.
 * For a list of time zone IDs, see {@link http://joda-time.sourceforge.net/timezones.html|JodaTime}.
 *
 * @return A string representation of the specified timestamp.
 */
export function format(timestamp: number | Date | string, format?: string, timeZoneId?: string): string;

/**
 * Creates a period representation of an argument.
 *
 * @example
 * issue.fields.Estimation = dateTime.toPeriod(3 * 3600 * 1000); // 3h in ms
 * issue.fields.Estimation = dateTime.toPeriod('3h'); // short form
 * issue.fields.Estimation = dateTime.toPeriod('2w4d3h15m'); // full form
 *
 * @param period A duration in milliseconds as either a number or a string. The string representation is a series of numeric values followed by the abbreviation that represents the timespan, in descending order. For example, 3w4d23h58m.
 * @return The period representation of the specified argument.
 * @see For possible usages, see {@link PeriodProjectCustomField}.
 */
export function toPeriod(period: number | string): Period;

/**
 * Returns a timestamp that represents a point in time after the specified period from the specified date.
 * @since 2018.2.42881
 * @param timestamp The base date value.
 * @param duration A duration as a number (in milliseconds), string representation, or period as retrieved from a custom field or returned by the toPeriod() function. The string representation is a series of numeric values followed by the abbreviation that represents the timespan, in descending order. For example, 3w4d23h58m.
 * @return The resulting timestamp.
 */
export function after(timestamp: number | Date | string, duration: number | string | Period): number;

/**
 * Returns a timestamp that represents a point in time before the specified period from the specified date.
 * @since 2018.2.42881
 * @param timestamp The base date value.
 * @param duration A duration as a number (in milliseconds), string representation, or period as retrieved from a custom field or returned by the toPeriod() function. The string representation is a series of numeric values followed by the abbreviation that represents the timespan, in descending order. For example, 3w4d23h58m.
 * @return The resulting timestamp.
 */
export function before(timestamp: number | Date | string, duration: number | string | Period): number;

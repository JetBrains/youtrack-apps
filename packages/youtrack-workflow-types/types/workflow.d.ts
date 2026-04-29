/**
 * This module contains utility functions that display workflow-related messages and warnings in the user interface.
 *
 * @module @jetbrains/youtrack-scripting-api/workflow
 */

/**
 * Displays the specified message in the YouTrack user interface.
 *
 * @param messageText The message text.
 */
export function message(messageText?: string): void;

/**
 * Checks to determine whether the specified condition is true.
 * If the condition is not true, the system throws an error.
 * All changes are rolled back to the initial state.
 * The error contains the specified message, which is displayed in the user interface.
 *
 * @example
 * workflow.check(issue.fields.Assignee && ctx.currentUser.login === issue.fields.Assignee.login,
 *   'Only Assignee can mark issue as Fixed.');
 *
 * @param condition The condition to check (any truthy value).
 * @param message The error message that is shown to the user in cases where the condition is false.
 * @param parameters Parameters for the message.
 */
export function check(condition?: any, message?: string, ...parameters: string[]): void;

/**
 * Returns a localized version of a message.
 * WARNING: for internal use only!
 * This method is only supported in default workflows where the IDs and text strings for localized messages are stored in the application.
 * References to this method in custom workflows are not supported.
 *
 * @param messageId The message ID.
 *
 * @returns An object that contains the placeholders and localized strings that are associated with the specified message.
 * When this object is passed to a function that expects a string value, the toString method is called internally,
 * replacing the parameters with the localized string.
 */
export function i18n(messageId?: string): any;

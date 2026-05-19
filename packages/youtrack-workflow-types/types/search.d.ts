/**
 * This module contains functionality that lets you search for issues in YouTrack.
 *
 * @module @jetbrains/youtrack-scripting-api/search
 */

import { Issue, WatchFolder, User } from './workflowTypeScriptStubs';

/**
 * Query object that supports searching by extension properties.
 */
export interface SearchQuery {
  /**
   * A YouTrack search query string.
   */
  query: string;

  /**
   * Extension properties to search by.
   */
  extensionPropertiesQuery?: {
    [key: string]: string;
  };
}

/**
 * Returns issues that match a search query.
 * If a sort order is not specified explicitly in the query, the issues that are returned are sorted in random order.
 *
 * @example
 * const search = require('@jetbrains/youtrack-scripting-api/search');
 * ...
 * const query = {
 *     query: 'for: me State: {In Progress} issue id: -' + issue.id,
 *     extensionPropertiesQuery: {
 *         property1: "value1",
 *         property2: "value2"
 *     }
 * }
 * const inProgress = search.search(issue.project, query, ctx.currentUser);
 * if (inProgress.isNotEmpty()) {
 *   // Do something with the found set of issues.
 * }
 *
 * @param folder The project, tag, or saved search to set as the search context.
 * If the value for this parameter is not provided, the search includes all issues.
 * This is equivalent to a search that is performed in the user interface with the context set to Everything.
 * @param query A YouTrack search query. If Object, supports searching by extension properties.
 * @param user The user account that executes the search query.
 * The list of issues that is returned excludes issues that the specified user does not have permission to view.
 * If the value for this parameter is not provided, the search query is executed on behalf of the current user.
 * @return The set of issues found by the search.
 */
export function search(folder: WatchFolder | null, query: string | SearchQuery, user?: User): Set<Issue>;

/**
 * Returns issues that match a search query.
 * If a sort order is not specified explicitly in the query, the issues that are returned are sorted in random order.
 *
 * @param query A YouTrack search query. If Object, supports searching by extension properties.
 * @param user The user account that executes the search query.
 * The list of issues that is returned excludes issues that the specified user does not have permission to view.
 * If the value for this parameter is not provided, the search query is executed on behalf of the current user.
 * @return The set of issues found by the search.
 */
export function search(query: string | SearchQuery, user?: User): Set<Issue>;

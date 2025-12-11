/**
 * Guard functions and validation checks for YouTrack workflow rules.
 * These functions help determine if a workflow rule should be executed based on various conditions.
 */

const httpModule = require('./workflow-http');
const fieldChanges = require('./workflow-field-changes');

/**
 * Creates a standard guard function for checking webhooks configuration
 * @param {string} settingsKey - The key in ctx.settings to check for webhooks
 * @param {Function} customCheck - Optional additional check function(ctx) => boolean
 * @returns {Function} Guard function
 */
function createGuard(settingsKey, customCheck) {
  return function(ctx) {
    // Run custom check first if provided
    if (customCheck && !customCheck(ctx)) {
      return false;
    }

    // Get all webhook URLs (event-specific + "All Events", deduplicated)
    const allUrls = httpModule.getWebhookUrls(ctx, settingsKey);

    if (allUrls.length === 0) {
      console.log('[webhooks] No webhooks configured for ' + settingsKey);
      return false;
    }

    console.log('[webhooks] Found ' + allUrls.length + ' webhook URL(s) for ' + settingsKey);
    return true;
  };
}

/**
 * Checks if an issue should be skipped (draft or invalid)
 * @param {Object} issue - The issue object
 * @param {string} eventName - Name of the event for logging
 * @returns {boolean} True if should skip, false otherwise
 */
function shouldSkipIssue(issue, eventName) {
  if (!issue.id || issue.id === 'Issue.Draft') {
    console.log('[webhooks] ' + eventName + ' - Skipping draft issue');
    return true;
  }
  return false;
}

/**
 * Checks if this is an issue creation event (not an update)
 * @param {Object} issue - The issue object
 * @returns {boolean} True if this is a creation event
 */
function isIssueCreation(issue) {
  return issue.becomesReported === true;
}

/**
 * Checks if any comments were added
 * @param {Object} issue - The issue object
 * @returns {boolean} True if comments were added
 */
function hasCommentsAdded(issue) {
  return issue.comments && issue.comments.added && !issue.comments.added.isEmpty();
}

/**
 * Checks if any comments were updated
 * @param {Object} issue - The issue object
 * @returns {boolean} True if comments were updated
 */
function hasCommentsUpdated(issue) {
  if (!issue.editedComments) {
    return false;
  }
  // editedComments is a collection object, check using isEmpty() method
  if (typeof issue.editedComments.isEmpty === 'function') {
    return !issue.editedComments.isEmpty();
  }
  // Fallback: check if it's an array with length
  return issue.editedComments.length > 0;
}

/**
 * Checks if any comments were removed
 * @param {Object} issue - The issue object
 * @returns {boolean} True if comments were removed
 */
function hasCommentsRemoved(issue) {
  return issue.comments && issue.comments.removed && !issue.comments.removed.isEmpty();
}

/**
 * Checks if any work items were added
 * @param {Object} issue - The issue object
 * @returns {boolean} True if work items were added
 */
function hasWorkItemsAdded(issue) {
  return issue.workItems && issue.workItems.added && !issue.workItems.added.isEmpty();
}

/**
 * Checks if any work items were updated
 * @param {Object} issue - The issue object
 * @returns {boolean} True if work items were updated
 */
function hasWorkItemsUpdated(issue) {
  if (!issue.editedWorkItems) {
    return false;
  }
  // editedWorkItems is a collection object, check using isEmpty() method
  if (typeof issue.editedWorkItems.isEmpty === 'function') {
    return !issue.editedWorkItems.isEmpty();
  }
  // Fallback: check if it's an array with length
  return issue.editedWorkItems.length > 0;
}

/**
 * Checks if any work items were removed
 * @param {Object} issue - The issue object
 * @returns {boolean} True if work items were removed
 */
function hasWorkItemsRemoved(issue) {
  return issue.workItems && issue.workItems.removed && !issue.workItems.removed.isEmpty();
}

/**
 * Checks if any attachments were added
 * @param {Object} issue - The issue object
 * @returns {boolean} True if attachments were added
 */
function hasAttachmentsAdded(issue) {
  return issue.attachments && issue.attachments.added && !issue.attachments.added.isEmpty();
}

/**
 * Checks if any attachments were removed
 * @param {Object} issue - The issue object
 * @returns {boolean} True if attachments were removed
 */
function hasAttachmentsRemoved(issue) {
  return issue.attachments && issue.attachments.removed && !issue.attachments.removed.isEmpty();
}

/**
 * Checks if any issue fields were changed
 * @param {Object} issue - The issue object
 * @returns {boolean} True if fields changed
 */
function hasFieldsChanged(issue) {
  // Use the field changes utility to detect if any fields changed
  const changedFields = fieldChanges.collectChangedFields(issue);
  return changedFields.length > 0;
}

exports.createGuard = createGuard;
exports.shouldSkipIssue = shouldSkipIssue;
exports.isIssueCreation = isIssueCreation;
exports.hasCommentsAdded = hasCommentsAdded;
exports.hasCommentsUpdated = hasCommentsUpdated;
exports.hasCommentsRemoved = hasCommentsRemoved;
exports.hasWorkItemsAdded = hasWorkItemsAdded;
exports.hasWorkItemsUpdated = hasWorkItemsUpdated;
exports.hasWorkItemsRemoved = hasWorkItemsRemoved;
exports.hasAttachmentsAdded = hasAttachmentsAdded;
exports.hasAttachmentsRemoved = hasAttachmentsRemoved;
exports.hasFieldsChanged = hasFieldsChanged;


const core = require('./workflow-core');
const { EVENTS } = require('./constants');

/**
 * Workflow rule that triggers webhooks when a work item is added to an issue.
 */
exports.rule = {
  title: 'webhooks: On Work Item Added',
  description: 'Triggers webhooks when a work item (time entry) is added to an issue',

  target: 'Issue',
  ruleType: 'onChange',
  onChange: true,

  // Guard: use core.createGuard with custom check for new work items
  guard: core.createGuard(EVENTS.WORK_ITEM_ADDED.key, function(ctx) {
    var issue = ctx.issue;

    // Skip draft issues
    if (core.shouldSkipIssue(issue, 'On Work Item Added')) {
      return false;
    }

    // Check if work items were added
    if (!core.hasWorkItemsAdded(issue)) {
      console.log('[webhooks] On Work Item Added - No new work items');
      return false;
    }

    console.log('[webhooks] On Work Item Added - Guard passed for issue: ' + issue.id);
    return true;
  }),

  // Action: collect added work items and send webhooks
  action: function(ctx) {
    console.log('[webhooks] On Work Item Added - Action triggered for issue: ' + ctx.issue.id);

    const issue = ctx.issue;
    const project = ctx.project;

    // Collect newly added work items
    const addedWorkItems = [];
    issue.workItems.added.forEach(function(workItem) {
      addedWorkItems.push({
        id: workItem.id,
        date: workItem.date,
        duration: workItem.duration,
        description: workItem.description,
        created: workItem.created,
        updated: workItem.updated,
        author: core.serializeUser(workItem.author),
        type: workItem.type ? {
          id: workItem.type.id,
          name: workItem.type.name
        } : null
      });
    });

    // Build payload using core helper
    const payload = core.createBasePayload(EVENTS.WORK_ITEM_ADDED.type, issue, project);
    payload.workItems = addedWorkItems;

    // Send to all configured webhooks
    core.sendWebhooks(ctx, EVENTS.WORK_ITEM_ADDED.key, payload, EVENTS.WORK_ITEM_ADDED.name);
  },

  requirements: {}
};


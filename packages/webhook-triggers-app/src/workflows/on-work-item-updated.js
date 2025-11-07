const core = require('./workflow-core');
const { EVENTS } = require('./constants');

/**
 * Workflow rule that triggers webhooks when a work item is updated.
 */
exports.rule = {
  title: 'webhooks: On Work Item Updated',
  description: 'Triggers webhooks when a work item (time entry) is updated on an issue',

  target: 'Issue',
  ruleType: 'onChange',
  onChange: true,

  // Guard: use core.createGuard with custom check for updated work items
  guard: core.createGuard(EVENTS.WORK_ITEM_UPDATED.key, function(ctx) {
    const issue = ctx.issue;

    // Skip draft issues
    if (core.shouldSkipIssue(issue, 'On Work Item Updated')) {
      return false;
    }

    // Check if work items were updated
    if (!core.hasWorkItemsUpdated(issue)) {
      console.log('[webhooks] On Work Item Updated - No updated work items');
      return false;
    }

    console.log('[webhooks] On Work Item Updated - Guard passed for issue: ' + issue.id);
    return true;
  }),

  // Action: collect updated work items and send webhooks
  action: function(ctx) {
    console.log('[webhooks] On Work Item Updated - Action triggered for issue: ' + ctx.issue.id);

    const issue = ctx.issue;
    const project = ctx.project;

    // Collect updated work items
    const updatedWorkItems = [];
    issue.editedWorkItems.forEach(function(workItem) {
      updatedWorkItems.push({
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
    const payload = core.createBasePayload(EVENTS.WORK_ITEM_UPDATED.type, issue, project);
    payload.workItems = updatedWorkItems;

    // Send to all configured webhooks
    core.sendWebhooks(ctx, EVENTS.WORK_ITEM_UPDATED.key, payload, EVENTS.WORK_ITEM_UPDATED.name);
  },

  requirements: {}
};


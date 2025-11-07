const core = require('./workflow-core');
const { EVENTS } = require('./constants');

/**
 * Workflow rule that triggers webhooks when an issue is deleted.
 * Retrieves webhook URLs from project storage and sends issue data to each URL.
 */
exports.rule = {
  title: 'webhooks: On Issue Deleted',
  description: 'Triggers webhooks when an issue is deleted',

  target: 'Issue',
  ruleType: 'onChange',

  // ONLY trigger on removal, not on change
  runOn: {
    change: false,
    removal: true
  },

  // Guard: use core.createGuard with custom check to skip draft cleanup
  guard: core.createGuard(EVENTS.ISSUE_DELETED.key, function(ctx) {
    var issue = ctx.issue;

    console.log('[webhooks] On Issue Deleted - Guard check for issue: ' + issue.id);

    // IMPORTANT: Skip draft issues being cleaned up during creation
    if (core.shouldSkipIssue(issue, 'On Issue Deleted')) {
      console.log('[webhooks] On Issue Deleted - Skipping draft issue cleanup');
      return false;
    }

    console.log('[webhooks] On Issue Deleted - Guard passed');
    return true;
  }),

  // Action: use core helpers to build payload and send webhooks
  action: function(ctx) {
    console.log('[webhooks] On Issue Deleted - Action triggered for issue: ' + ctx.issue.id);

    const issue = ctx.issue;
    const project = ctx.project;

    // Build payload using core helper + add issue-specific fields
    const payload = core.createBasePayload(EVENTS.ISSUE_DELETED.type, issue, project);
    payload.description = issue.description;

    // Send to all configured webhooks (handles comma AND newline separation)
    core.sendWebhooks(ctx, EVENTS.ISSUE_DELETED.key, payload, EVENTS.ISSUE_DELETED.name);
  },

  requirements: {}
};

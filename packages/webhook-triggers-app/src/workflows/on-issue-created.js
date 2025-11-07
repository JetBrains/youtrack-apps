const core = require('./workflow-core');
const { EVENTS } = require('./constants');

/**
 * Workflow rule that triggers webhooks when a new issue is created.
 * Retrieves webhook URLs from project storage and sends issue data to each URL.
 */
exports.rule = {
  title: 'webhooks: On Issue Created',
  description: 'Triggers webhooks when a new issue is created',

  target: 'Issue',
  ruleType: 'onChange',
  onCreate: true,

  // Guard: use core.createGuard with custom check for issue creation
  guard: core.createGuard(EVENTS.ISSUE_CREATED.key, function(ctx) {
    var issue = ctx.issue;

    console.log('[webhooks] On Issue Created - Guard check for issue id: ' + issue.id);

    // Skip draft issues
    if (core.shouldSkipIssue(issue, 'On Issue Created')) {
      return false;
    }

    // Only trigger on actual creation (becomesReported = true)
    if (!core.isIssueCreation(issue)) {
      console.log('[webhooks] Skipping - not a creation event');
      return false;
    }

    console.log('[webhooks] On Issue Created - Guard passed');
    return true;
  }),

  // Action: use core helpers to build payload and send webhooks
  action: function(ctx) {
    console.log('[webhooks] On Issue Created - Action triggered for issue: ' + ctx.issue.id);

    const issue = ctx.issue;
    const project = ctx.project;

    // Build payload using core helper + add issue-specific fields
    const payload = core.createBasePayload(EVENTS.ISSUE_CREATED.type, issue, project);
    payload.description = issue.description;
    payload.created = issue.created;
    payload.reporter = core.serializeUser(issue.reporter);

    // Send to all configured webhooks (handles comma AND newline separation)
    core.sendWebhooks(ctx, EVENTS.ISSUE_CREATED.key, payload, EVENTS.ISSUE_CREATED.name);
  },

  requirements: {}
};


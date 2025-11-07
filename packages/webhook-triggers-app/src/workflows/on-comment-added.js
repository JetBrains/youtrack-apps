const core = require('./workflow-core');
const { EVENTS } = require('./constants');

/**
 * Workflow rule that triggers webhooks when a comment is added to an issue.
 */
exports.rule = {
  title: 'webhooks: On Comment Added',
  description: 'Triggers webhooks when a comment is added to an issue',

  target: 'Issue',
  ruleType: 'onChange',
  onChange: true,

  // Guard: use core.createGuard with custom check for new comments
  guard: core.createGuard(EVENTS.COMMENT_ADDED.key, function(ctx) {
    const issue = ctx.issue;

    // Skip draft issues
    if (core.shouldSkipIssue(issue, 'On Comment Added')) {
      return false;
    }

    // Check if comments were added
    if (!core.hasCommentsAdded(issue)) {
      console.log('[webhooks] On Comment Added - No new comments');
      return false;
    }

    console.log('[webhooks] On Comment Added - Guard passed for issue: ' + issue.id);
    return true;
  }),

  // Action: collect added comments and send webhooks
  action: function(ctx) {
    console.log('[webhooks] On Comment Added - Action triggered for issue: ' + ctx.issue.id);

    const issue = ctx.issue;
    const project = ctx.project;

    // Collect newly added comments
    const addedComments = [];
    issue.comments.added.forEach(function(comment) {
      addedComments.push({
        id: comment.id,
        text: comment.text,
        textPreview: comment.textPreview,
        created: comment.created,
        updated: comment.updated,
        author: core.serializeUser(comment.author)
      });
    });

    // Build payload using core helper
    const payload = core.createBasePayload(EVENTS.COMMENT_ADDED.type, issue, project);
    payload.comments = addedComments;

    // Send to all configured webhooks
    core.sendWebhooks(ctx, EVENTS.COMMENT_ADDED.key, payload, EVENTS.COMMENT_ADDED.name);
  },

  requirements: {}
};

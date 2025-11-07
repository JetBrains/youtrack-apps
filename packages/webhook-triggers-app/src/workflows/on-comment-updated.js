const core = require('./workflow-core');
const { EVENTS } = require('./constants');

/**
 * Workflow rule that triggers webhooks when a comment is updated.
 */
exports.rule = {
  title: 'webhooks: On Comment Updated',
  description: 'Triggers webhooks when a comment is updated on an issue',

  target: 'Issue',
  ruleType: 'onChange',
  onChange: true,

  // Guard: use core.createGuard with custom check for updated comments
  guard: core.createGuard(EVENTS.COMMENT_UPDATED.key, function(ctx) {
    var issue = ctx.issue;

    console.log('[webhooks] On Comment Updated - Issue: ' + issue.id);
    console.log('[webhooks] On Comment Updated - editedComments exists: ' + (!!issue.editedComments));
    if (issue.editedComments) {
      console.log('[webhooks] On Comment Updated - editedComments type: ' + typeof issue.editedComments);
      console.log('[webhooks] On Comment Updated - editedComments isEmpty: ' + (typeof issue.editedComments.isEmpty === 'function' ? issue.editedComments.isEmpty() : 'N/A'));
      console.log('[webhooks] On Comment Updated - editedComments length: ' + (issue.editedComments.length || 'N/A'));
    }

    // Skip draft issues
    if (core.shouldSkipIssue(issue, 'On Comment Updated')) {
      return false;
    }

    // Check if comments were updated
    if (!core.hasCommentsUpdated(issue)) {
      console.log('[webhooks] On Comment Updated - No updated comments');
      return false;
    }

    console.log('[webhooks] On Comment Updated - Guard passed for issue: ' + issue.id);
    return true;
  }),

  // Action: collect updated comments and send webhooks
  action: function(ctx) {
    console.log('[webhooks] On Comment Updated - Action triggered for issue: ' + ctx.issue.id);

    const issue = ctx.issue;
    const project = ctx.project;

    // Collect updated comments
    const updatedComments = [];
    issue.editedComments.forEach(function(comment) {
      updatedComments.push({
        id: comment.id,
        text: comment.text,
        textPreview: comment.textPreview,
        created: comment.created,
        updated: comment.updated,
        author: core.serializeUser(comment.author)
      });
    });

    // Build payload using core helper
    const payload = core.createBasePayload(EVENTS.COMMENT_UPDATED.type, issue, project);
    payload.comments = updatedComments;

    // Send to all configured webhooks
    core.sendWebhooks(ctx, EVENTS.COMMENT_UPDATED.key, payload, EVENTS.COMMENT_UPDATED.name);
  },

  requirements: {}
};


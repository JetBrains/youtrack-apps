const core = require('./workflow-core');
const {EVENTS} = require('./constants');

/**
 * Workflow rule that triggers webhooks when a comment is deleted.
 */
exports.rule = {
    title: 'webhooks: On Comment Deleted',
    description: 'Triggers webhooks when a comment is deleted from an issue',

    target: 'Issue',
    ruleType: 'onChange',
    onChange: true,

    guard: core.createGuard(EVENTS.COMMENT_DELETED.key, function (ctx) {
        var issue = ctx.issue;

        if (core.shouldSkipIssue(issue, 'On Comment Deleted')) {
            return false;
        }

        if (!core.hasCommentsRemoved(issue)) {
            console.log('[webhooks] On Comment Deleted - No removed comments');
            return false;
        }

        console.log('[webhooks] On Comment Deleted - Guard passed for issue: ' + issue.id);
        return true;
    }),

    action: function (ctx) {
        console.log('[webhooks] On Comment Deleted - Action triggered for issue: ' + ctx.issue.id);

        const issue = ctx.issue;
        const project = ctx.project;

        const removedComments = [];
        issue.comments.removed.forEach(function (comment) {
            removedComments.push({
                id: comment.id,
                text: comment.text,
                textPreview: comment.textPreview,
                created: comment.created,
                author: core.serializeUser(comment.author)
            });
        });

        const payload = core.createBasePayload(EVENTS.COMMENT_DELETED.type, issue, project);
        payload.comments = removedComments;

        core.sendWebhooks(ctx, EVENTS.COMMENT_DELETED.key, payload, EVENTS.COMMENT_DELETED.name);
    },

    requirements: {}
};

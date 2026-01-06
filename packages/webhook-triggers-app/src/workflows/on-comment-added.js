const core = require('./workflow-core');
const {EVENTS} = require('./constants');

/**
 * Workflow rule that triggers webhooks when a comment is added to an issue.
 */
exports.rule = {
    title: 'webhooks: On Comment Added',
    description: 'Triggers webhooks when a comment is added to an issue',

    target: 'Issue',
    ruleType: 'onChange',
    onChange: true,

    guard: core.createGuard(EVENTS.COMMENT_ADDED.key, function (ctx) {
        const issue = ctx.issue;

        if (core.shouldSkipIssue(issue, 'On Comment Added')) {
            return false;
        }

        if (!core.hasCommentsAdded(issue)) {
            console.log('[webhooks] On Comment Added - No new comments');
            return false;
        }

        console.log('[webhooks] On Comment Added - Guard passed for issue: ' + issue.id);
        return true;
    }),

    action: function (ctx) {
        console.log('[webhooks] On Comment Added - Action triggered for issue: ' + ctx.issue.id);

        const issue = ctx.issue;
        const project = ctx.project;

        const addedComments = [];
        issue.comments.added.forEach(function (comment) {
            addedComments.push({
                id: comment.id,
                text: comment.text,
                textPreview: comment.textPreview,
                created: comment.created,
                updated: comment.updated,
                author: core.serializeUser(comment.author)
            });
        });

        const payload = core.createBasePayload(EVENTS.COMMENT_ADDED.type, issue, project);
        payload.comments = addedComments;

        core.sendWebhooks(ctx, EVENTS.COMMENT_ADDED.key, payload, EVENTS.COMMENT_ADDED.name);
    },

    requirements: {}
};

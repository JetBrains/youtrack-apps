const core = require('./workflow-core');
const {EVENTS} = require('./constants');

/**
 * Workflow rule that triggers webhooks when an attachment is removed from an issue.
 */
exports.rule = {
    title: 'webhooks: On Attachment Deleted',
    description: 'Triggers webhooks when an attachment is removed from an issue',

    target: 'Issue',
    ruleType: 'onChange',
    onChange: true,

    guard: core.createGuard(EVENTS.ATTACHMENT_DELETED.key, function (ctx) {
        const issue = ctx.issue;

        if (core.shouldSkipIssue(issue, 'On Attachment Deleted')) {
            return false;
        }

        if (!core.hasAttachmentsRemoved(issue)) {
            console.log('[webhooks] On Attachment Deleted - No removed attachments');
            return false;
        }

        console.log('[webhooks] On Attachment Deleted - Guard passed for issue: ' + issue.id);
        return true;
    }),

    action: function (ctx) {
        console.log('[webhooks] On Attachment Deleted - Action triggered for issue: ' + ctx.issue.id);

        const issue = ctx.issue;
        const project = ctx.project;

        const removedAttachments = [];
        issue.attachments.removed.forEach(function (attachment) {
            const attachmentData = {
                name: attachment.name,
                mimeType: attachment.mimeType,
                size: attachment.size,
                created: attachment.created,
                author: core.serializeUser(attachment.author)
            };

            removedAttachments.push(attachmentData);
        });

        const payload = core.createBasePayload(EVENTS.ATTACHMENT_DELETED.type, issue, project);
        payload.attachments = removedAttachments;

        core.sendWebhooks(ctx, EVENTS.ATTACHMENT_DELETED.key, payload, EVENTS.ATTACHMENT_DELETED.name);
    },

    requirements: {}
};

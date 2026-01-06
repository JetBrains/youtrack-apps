const core = require('./workflow-core');
const {EVENTS} = require('./constants');

/**
 * Workflow rule that triggers webhooks when an attachment is added to an issue.
 */
exports.rule = {
    title: 'webhooks: On Attachment Added',
    description: 'Triggers webhooks when an attachment is added to an issue',

    target: 'Issue',
    ruleType: 'onChange',
    onChange: true,


    guard: core.createGuard(EVENTS.ATTACHMENT_ADDED.key, function (ctx) {
        const issue = ctx.issue;


        if (core.shouldSkipIssue(issue, 'On Attachment Added')) {
            return false;
        }


        if (!core.hasAttachmentsAdded(issue)) {
            console.log('[webhooks] On Attachment Added - No new attachments');
            return false;
        }

        console.log('[webhooks] On Attachment Added - Guard passed for issue: ' + issue.id);
        return true;
    }),


    action: function (ctx) {
        console.log('[webhooks] On Attachment Added - Action triggered for issue: ' + ctx.issue.id);

        const issue = ctx.issue;
        const project = ctx.project;


        const addedAttachments = [];
        issue.attachments.added.forEach(function (attachment) {
            console.log('[webhooks] Attachment fields available: ' + Object.keys(attachment).join(', '));

            const attachmentData = {
                name: attachment.name,
                mimeType: attachment.mimeType,
                size: attachment.size,
                created: attachment.created,
                author: core.serializeUser(attachment.author)
            };


            addedAttachments.push(attachmentData);
        });


        const payload = core.createBasePayload(EVENTS.ATTACHMENT_ADDED.type, issue, project);
        payload.attachments = addedAttachments;


        core.sendWebhooks(ctx, EVENTS.ATTACHMENT_ADDED.key, payload, EVENTS.ATTACHMENT_ADDED.name);
    },

    requirements: {}
};


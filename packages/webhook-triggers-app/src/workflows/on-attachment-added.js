const core = require('./workflow-core');
const { EVENTS } = require('./constants');

/**
 * Workflow rule that triggers webhooks when an attachment is added to an issue.
 */
exports.rule = {
  title: 'webhooks: On Attachment Added',
  description: 'Triggers webhooks when an attachment is added to an issue',

  target: 'Issue',
  ruleType: 'onChange',
  onChange: true,

  // Guard: use core.createGuard with custom check for new attachments
  guard: core.createGuard(EVENTS.ATTACHMENT_ADDED.key, function(ctx) {
    const issue = ctx.issue;

    // Skip draft issues
    if (core.shouldSkipIssue(issue, 'On Attachment Added')) {
      return false;
    }

    // Check if attachments were added
    if (!core.hasAttachmentsAdded(issue)) {
      console.log('[webhooks] On Attachment Added - No new attachments');
      return false;
    }

    console.log('[webhooks] On Attachment Added - Guard passed for issue: ' + issue.id);
    return true;
  }),

  // Action: collect added attachments and send webhooks
  action: function(ctx) {
    console.log('[webhooks] On Attachment Added - Action triggered for issue: ' + ctx.issue.id);

    const issue = ctx.issue;
    const project = ctx.project;

    // Collect newly added attachments
    const addedAttachments = [];
    issue.attachments.added.forEach(function(attachment) {
      console.log('[webhooks] Attachment fields available: ' + Object.keys(attachment).join(', '));

      const attachmentData = {
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        created: attachment.created,
        author: core.serializeUser(attachment.author)
      };

      // Add optional fields only if they exist
      if (attachment.id) {
        attachmentData.id = attachment.id;
      }
      if (attachment.url) {
        attachmentData.url = attachment.url;
      }

      addedAttachments.push(attachmentData);
    });

    // Build payload using core helper
    const payload = core.createBasePayload(EVENTS.ATTACHMENT_ADDED.type, issue, project);
    payload.attachments = addedAttachments;

    // Send to all configured webhooks
    core.sendWebhooks(ctx, EVENTS.ATTACHMENT_ADDED.key, payload, EVENTS.ATTACHMENT_ADDED.name);
  },

  requirements: {}
};


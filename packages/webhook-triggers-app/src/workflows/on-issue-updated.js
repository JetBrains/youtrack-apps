const core = require('./workflow-core');
const {EVENTS} = require('./constants');
const {collectChangedFields} = require('./workflow-field-changes');

/**
 * Workflow rule that triggers webhooks when an issue is updated.
 * Only triggers for FIELD changes, not comments/work items/attachments.
 */
exports.rule = {
    title: 'webhooks: On Issue Updated',
    description: 'Triggers webhooks when issue fields are updated',

    target: 'Issue',
    ruleType: 'onChange',
    onChange: true,

    guard: core.createGuard(EVENTS.ISSUE_UPDATED.key, function (ctx) {
        var issue = ctx.issue;

        console.log('[webhooks] On Issue Updated - Guard check for issue id: ' + issue.id);


        if (core.shouldSkipIssue(issue, 'On Issue Updated')) {
            return false;
        }

        // Skip if this is issue creation
        if (core.isIssueCreation(issue)) {
            console.log('[webhooks] On Issue Updated - Skipping issue creation');
            return false;
        }

        // Skip if comments changed (handled by comment workflows)
        if (core.hasCommentsAdded(issue) || core.hasCommentsUpdated(issue) || core.hasCommentsRemoved(issue)) {
            console.log('[webhooks] On Issue Updated - Skipping, comments changed');
            return false;
        }

        // Skip if work items changed (handled by work item workflows)
        if (core.hasWorkItemsAdded(issue) || core.hasWorkItemsUpdated(issue) || core.hasWorkItemsRemoved(issue)) {
            console.log('[webhooks] On Issue Updated - Skipping, work items changed');
            return false;
        }

        // Skip if attachments changed (handled by attachment workflows)
        if (core.hasAttachmentsAdded(issue) || core.hasAttachmentsRemoved(issue)) {
            console.log('[webhooks] On Issue Updated - Skipping, attachments changed');
            return false;
        }


        if (!core.hasFieldsChanged(issue)) {
            console.log('[webhooks] On Issue Updated - No fields changed');
            return false;
        }

        console.log('[webhooks] On Issue Updated - Guard passed for issue: ' + issue.id);
        return true;
    }),

    action: function (ctx) {
        console.log('[webhooks] On Issue Updated - Action triggered for issue: ' + ctx.issue.id);

        const issue = ctx.issue;
        const project = ctx.project;


        const changedFields = collectChangedFields(issue);

        // Create payload
        const payload = core.createBasePayload(EVENTS.ISSUE_UPDATED.type, issue, project);
        payload.description = issue.description;
        payload.updated = issue.updated;
        payload.updatedBy = core.serializeUser(issue.updatedBy);
        payload.changedFields = changedFields;

        // Send webhooks
        core.sendWebhooks(ctx, EVENTS.ISSUE_UPDATED.key, payload, EVENTS.ISSUE_UPDATED.name);
    },

    requirements: {}
};

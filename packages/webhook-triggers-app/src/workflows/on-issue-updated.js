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

        if (core.shouldSkipIssue(issue)) {
            return false;
        }

        if (core.isIssueCreation(issue)) {
            return false;
        }

        if (core.hasCommentsAdded(issue) || core.hasCommentsUpdated(issue) || core.hasCommentsRemoved(issue)) {
            return false;
        }

        if (core.hasWorkItemsAdded(issue) || core.hasWorkItemsUpdated(issue) || core.hasWorkItemsRemoved(issue)) {
            return false;
        }

        if (core.hasAttachmentsAdded(issue) || core.hasAttachmentsRemoved(issue)) {
            return false;
        }

        if (!core.hasFieldsChanged(issue)) {
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

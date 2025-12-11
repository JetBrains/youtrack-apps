const core = require('./workflow-core');
const {EVENTS} = require('./constants');

/**
 * Workflow rule that triggers webhooks when a work item is deleted.
 */
exports.rule = {
    title: 'webhooks: On Work Item Deleted',
    description: 'Triggers webhooks when a work item (time entry) is deleted from an issue',

    target: 'Issue',
    ruleType: 'onChange',
    onChange: true,


    guard: core.createGuard(EVENTS.WORK_ITEM_DELETED.key, function (ctx) {
        var issue = ctx.issue;


        if (core.shouldSkipIssue(issue, 'On Work Item Deleted')) {
            return false;
        }


        if (!core.hasWorkItemsRemoved(issue)) {
            console.log('[webhooks] On Work Item Deleted - No removed work items');
            return false;
        }

        console.log('[webhooks] On Work Item Deleted - Guard passed for issue: ' + issue.id);
        return true;
    }),


    action: function (ctx) {
        console.log('[webhooks] On Work Item Deleted - Action triggered for issue: ' + ctx.issue.id);

        const issue = ctx.issue;
        const project = ctx.project;


        const removedWorkItems = [];
        issue.workItems.removed.forEach(function (workItem) {
            removedWorkItems.push({
                id: workItem.id,
                date: workItem.date,
                duration: workItem.duration,
                description: workItem.description,
                created: workItem.created,
                author: core.serializeUser(workItem.author),
                type: workItem.type ? {
                    id: workItem.type.id,
                    name: workItem.type.name
                } : null
            });
        });


        const payload = core.createBasePayload(EVENTS.WORK_ITEM_DELETED.type, issue, project);
        payload.workItems = removedWorkItems;


        core.sendWebhooks(ctx, EVENTS.WORK_ITEM_DELETED.key, payload, EVENTS.WORK_ITEM_DELETED.name);
    },

    requirements: {}
};


const core = require('./workflow-core');
const {EVENTS} = require('./constants');

/**
 * Workflow rule that triggers webhooks when a work item is added to an issue.
 */
exports.rule = {
    title: 'webhooks: On Work Item Added',
    description: 'Triggers webhooks when a work item (time entry) is added to an issue',

    target: 'Issue',
    ruleType: 'onChange',
    onChange: true,


    guard: core.createGuard(EVENTS.WORK_ITEM_ADDED.key, function (ctx) {
        var issue = ctx.issue;


        if (core.shouldSkipIssue(issue, 'On Work Item Added')) {
            return false;
        }


        if (!core.hasWorkItemsAdded(issue)) {
            console.log('[webhooks] On Work Item Added - No new work items');
            return false;
        }

        console.log('[webhooks] On Work Item Added - Guard passed for issue: ' + issue.id);
        return true;
    }),


    action: function (ctx) {
        console.log('[webhooks] On Work Item Added - Action triggered for issue: ' + ctx.issue.id);

        const issue = ctx.issue;
        const project = ctx.project;


        const addedWorkItems = [];
        issue.workItems.added.forEach(function (workItem) {
            addedWorkItems.push({
                id: workItem.id,
                date: workItem.date,
                duration: workItem.duration,
                description: workItem.description,
                created: workItem.created,
                updated: workItem.updated,
                author: core.serializeUser(workItem.author),
                type: workItem.type ? {
                    id: workItem.type.id,
                    name: workItem.type.name
                } : null
            });
        });


        const payload = core.createBasePayload(EVENTS.WORK_ITEM_ADDED.type, issue, project);
        payload.workItems = addedWorkItems;


        core.sendWebhooks(ctx, EVENTS.WORK_ITEM_ADDED.key, payload, EVENTS.WORK_ITEM_ADDED.name);
    },

    requirements: {}
};


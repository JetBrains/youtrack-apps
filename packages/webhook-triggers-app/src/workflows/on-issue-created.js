const core = require('./workflow-core');
const {EVENTS} = require('./constants');

/**
 * Workflow rule that triggers webhooks when a new issue is created.
 * Retrieves webhook URLs from project storage and sends issue data to each URL.
 */
exports.rule = {
    title: 'webhooks: On Issue Created',
    description: 'Triggers webhooks when a new issue is created',

    target: 'Issue',
    ruleType: 'onChange',
    onCreate: true,


    guard: core.createGuard(EVENTS.ISSUE_CREATED.key, function (ctx) {
        var issue = ctx.issue;

        if (core.shouldSkipIssue(issue)) {
            return false;
        }

        if (!core.isIssueCreation(issue)) {
            return false;
        }

        console.log('[webhooks] On Issue Created - Guard passed for issue: ' + issue.id);
        return true;
    }),

    action: function (ctx) {
        console.log('[webhooks] On Issue Created - Action triggered for issue: ' + ctx.issue.id);

        const issue = ctx.issue;
        const project = ctx.project;


        const payload = core.createBasePayload(EVENTS.ISSUE_CREATED.type, issue, project);
        payload.description = issue.description;
        payload.created = issue.created;
        payload.reporter = core.serializeUser(issue.reporter);


        core.sendWebhooks(ctx, EVENTS.ISSUE_CREATED.key, payload, EVENTS.ISSUE_CREATED.name);
    },

    requirements: {}
};


const {isValidSets} = require('./sets-validation');

// Status sets of one project. They are stored on the project as a JSON string: '{"sets":[...]}'
const PREDEFINED_SETS = "{\"sets\":[{\"name\":\"Predefined\",\"values\":[{\"name\":\"Not executed\",\"color\":\"#fff\",\"textColor\":\"black\"},{\"name\":\"Passed\",\"color\":\"#5FAD65\",\"textColor\":\"black\"},{\"name\":\"Failed\",\"color\":\"#932530\",\"textColor\":\"white\"},{\"name\":\"Skipped\",\"color\":\"#C9CCD6\",\"textColor\":\"black\"},{\"name\":\"Blocked\",\"color\":\"#F2C55C\",\"textColor\":\"white\"}]},{\"name\":\"Proofreading\",\"values\":[{\"name\":\"Open\",\"color\":\"#B6E5E7\",\"textColor\":\"white\"},{\"name\":\"Done\",\"color\":\"#1F8039\",\"textColor\":\"black\"},{\"name\":\"In Progress\",\"color\":\"#89C398\",\"textColor\":\"white\"}]}]}";

// Any project team member can manage the sets; project admins can too, even outside the team
const canEdit = (ctx) => ctx.currentUser.hasPermission('UPDATE_PROJECT', ctx.project) ||
    ctx.currentUser.isInGroup(ctx.project.team.name);

exports.httpHandler = {
    endpoints: [
        {
            method: 'GET',
            path: 'sets',
            scope: 'PROJECT',
            handle: (ctx) => {
                ctx.response.json({
                    sets: ctx.project.extensionProperties.statusSets || PREDEFINED_SETS,
                    canEdit: canEdit(ctx),
                    // Resolved for this project, with the global value as the fallback
                    issueTracking: ctx.settings.issueTracking !== false
                });
            }
        },
        {
            method: 'POST',
            path: 'sets',
            scope: 'PROJECT',
            handle: (ctx) => {
                // Endpoints run with the app's rights, so this check is the only write protection
                if (!canEdit(ctx)) {
                    ctx.response.code = 403;
                    ctx.response.json({error: 'Only project team members can change the status sets'});
                    return;
                }
                const body = ctx.request.json();
                if (!isValidSets(body.sets)) {
                    ctx.response.code = 400;
                    ctx.response.json({error: 'Invalid status sets payload'});
                    return;
                }
                ctx.project.extensionProperties.statusSets = body.sets;
                ctx.response.json({saved: true});
            }
        }
    ]
};

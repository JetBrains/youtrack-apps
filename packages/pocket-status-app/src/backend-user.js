const {isValidSets} = require('./sets-validation');

// Personal status sets of one user, stored on the user as a JSON string: '{"sets":[...]}'.
// Anyone who can see the user reads them, so a widget with a personal set still switches for colleagues.
const NO_SETS = '{"sets":[]}';

// Only the owner changes their sets
const isOwner = (ctx) => ctx.currentUser.login === ctx.user.login;

exports.httpHandler = {
    endpoints: [
        {
            method: 'GET',
            path: 'sets',
            scope: 'USER',
            handle: (ctx) => {
                ctx.response.json({
                    sets: ctx.user.extensionProperties.statusSets || NO_SETS,
                    canEdit: isOwner(ctx)
                });
            }
        },
        {
            method: 'POST',
            path: 'sets',
            scope: 'USER',
            handle: (ctx) => {
                // Endpoints run with the app's rights, so this check is the only write protection
                if (!isOwner(ctx)) {
                    ctx.response.code = 403;
                    ctx.response.json({error: 'Only the owner can change personal status sets'});
                    return;
                }
                const body = ctx.request.json();
                if (!isValidSets(body.sets)) {
                    ctx.response.code = 400;
                    ctx.response.json({error: 'Invalid status sets payload'});
                    return;
                }
                ctx.user.extensionProperties.statusSets = body.sets;
                ctx.response.json({saved: true});
            }
        }
    ]
};

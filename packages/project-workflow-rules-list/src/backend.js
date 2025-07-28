
exports.httpHandler = {
  endpoints: [
    {
      method: 'GET',
      path: 'current-project',
      scope: 'project',
      handle: function handle(ctx) {
        const project = ctx.project;
        ctx.response.json({
          name: project.name,
          key: project.key,
        });
      }
    }
  ]
};

---
to: src/<%= handlerName %>.js
inject: true
after: '// Put handlers below'
---
    {
      method: '<%= method %>',
      path: '<%= path %>',
<% if (handlerScope !== 'global'){ -%>
      scope: '<%= handlerScope %>',
<% } -%><% if (permissions.length > 0){ -%>
      permissions: [<%- permissions.map(p => `'${p}'`).join(', ') %>],
<% } -%>
      handle: function handle(ctx) {
        // See more https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html#request
        const requestParam = ctx.request.getParameter('test');
        // See more https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html#response
        ctx.response.json({test: requestParam});
      }
    },

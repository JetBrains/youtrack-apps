---
to: src/<%= handlerName %>.js
inject: true
after: 'endpoints: \['
---
    {
      method: '<%= method %>',
      path: '<%= path %>',
<% if (handlerScope !== 'global'){ -%>
      scope: '<%= handlerScope %>', // See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html#scope
<% } -%><% if (permissions.length > 0){ -%>
      permissions: [<%- permissions.map(p => `'${p}'`).join(', ') %>],
<% } -%>
      // to call this handler from App Widget, run
      // `const res = await host.fetchApp('<%= handlerName %>/<%= path %>', {method: '<%= method %>',<% if (handlerScope !== 'global'){ -%> scope: true,<%}-%> query: {test: '123'}})`
      handle: function handle(ctx) {
        // See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html#request
        const requestParam = ctx.request.getParameter('test');
        // See https://www.jetbrains.com/help/youtrack/devportal-apps/apps-reference-http-handlers.html#response
        ctx.response.json({test: requestParam});
      }
    },

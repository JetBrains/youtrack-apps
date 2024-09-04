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
      handle: function handleDebug(ctx) {
        ctx.response.json({test: true});
      }
    },

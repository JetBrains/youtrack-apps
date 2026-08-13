---
to: "<%= isEnhancedDX ? 'src/workflows' : 'src' %>/<%= name %>.<%= isEnhancedDX ? 'ts' : 'js' %>"
unless_exists: true
---
<%- content %>

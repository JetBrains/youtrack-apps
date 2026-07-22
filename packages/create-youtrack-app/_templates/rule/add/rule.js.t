---
to: "src/workflows/<%= name %>.<%= isEnhancedDX ? 'ts' : 'js' %>"
unless_exists: true
---
<%- content %>

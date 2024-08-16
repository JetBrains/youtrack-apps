---
to: src/manifest.json
inject: true
after: '\"widgets\": \['
sh: npx prettier --write src/manifest.json
---
    {
      "key": "<%= key %>",
<% if(name){ -%>
      "name": "<%= name %>",
<% } -%>
      "indexPath": "<%= indexPath %>",
      "extensionPoint": "<%= extensionPoint %>",
      "description": "<%= description %>",
 <% if (addDimensions){ -%>
      "expectedDimensions": {
        "width": <%= width %>,
        "height": <%= height %>
      },
 <% } -%>
 <% if(iconPath){ -%>
      "iconPath": "<%= iconPath %>",
 <% } -%>
    },
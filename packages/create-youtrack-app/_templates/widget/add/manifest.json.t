---
to: manifest.json
inject: true
after: '\"widgets\": \['
sh: npx prettier --write manifest.json
---
    {
      "key": "<%= key %>",
<% if(name){ -%>
      "name": "<%= name %>",
<% } -%>
      "indexPath": "<%= indexPath %>",
      "extensionPoint": "<%= extensionPoint %>",
      "description": "<%= description %>",
      "iconPath": "widget-icon.svg"
 <% if (addDimensions){ -%>
,
        "expectedDimensions": {
        "width": <%= width %>,
        "height": <%= height %>
      }
 <% } -%>
    },

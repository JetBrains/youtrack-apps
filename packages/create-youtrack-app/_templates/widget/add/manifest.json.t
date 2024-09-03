---
to: manifest.json
inject: true
after: '\"widgets\": \['
---
    {
      "key": "<%= key %>",
<% if(name){ -%>
      "name": "<%= name %>",
<% } -%>
      "indexPath": "<%= indexPath %>",
      "extensionPoint": "<%= extensionPoint %>",
      "description": "<%= description %>",
      "iconPath": "<%= folderName %>/widget-icon.svg"
 <% if (addDimensions){ -%>
,
        "expectedDimensions": {
        "width": <%= width %>,
        "height": <%= height %>
      }
 <% } -%>
    },

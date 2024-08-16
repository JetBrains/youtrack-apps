---
to: src/settings.json
inject: true
after: properties
---
    "<%= name %>": {
        "type":"<%= type %>",
        "title": "<%= title %>",
        "description": "<%= description %>",
        <% if(format){ -%>
        "format": "<%= format %>",
        <% } -%>
        <% if(enumValues){ -%>
"enum": <%- enumValues %>,
        <% } -%>
        <% if(xEntity&&type==="object"){ -%>
        "x-entity": "<%= xEntity %>",
        <% } -%>
        <% if(xEntity&&type==="array"){ -%>
        "items": {
            "type": "object",
            "x-entity": "<%= xEntity %>"
        },
        <% } -%>
        <% if(minimum!==undefined){ -%>
        "minimum": <%= minimum %>,
        <% } -%>
        <% if(maximum!==undefined){ -%>
        "maximum": <%= maximum %>,
        <% } -%>
        <% if(minLength!==undefined){ -%>
        "minLength": <%= minLength %>,
        <% } -%>
        <% if(maxLength!==undefined){ -%>
        "maxLength": <%= maxLength %>,
        <% } -%>
        <% if(exclusiveMinimum !== undefined){ -%>
        "exclusiveMinimum": <%= exclusiveMinimum %>,
        <% } -%>
        <% if(exclusiveMaximum !== undefined){ -%>
        "exclusiveMaximum": <%= exclusiveMaximum %>,
        <% } -%>
        <% if(multipleOf !== undefined){ -%>
        "multipleOf": <%= multipleOf %>,
        <% } -%>
        <% if(writeOnly){ -%>
        "writeOnly": true,
        <% } -%>
        <% if(readOnly){ -%>
        "readOnly": true,
        <% } -%>
        <% if(constValue!==undefined){ -%>
"const": <%- constValue %>,
        <% } -%>
        <% if(xScope!=="none"){ -%>
        "x-scope": "<%= xScope %>"
        <% } -%>
    },
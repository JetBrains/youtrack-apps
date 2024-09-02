---
 to: manifest.json
---
{
  "name" : "<%= appName %>",
  "title" : "<%= title %>",
  "description" :  "<%= description %>",
  "vendor": {
    "name": "<%= vendor %>",
    "url": "<%= vendorUrl %>"
  },
  "icon": "icon.svg",
  "widgets": [
    {
      "key": "main-widget",
      "name": "<%= appName %> Widget",
      "indexPath": "main/index.html",
      "extensionPoint": "ISSUE_BELOW_SUMMARY"
    },
  ]
}

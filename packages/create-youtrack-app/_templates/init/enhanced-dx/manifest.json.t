---
to: manifest.json
---
{
  "name": "<%= appName %>",
  "title": "<%= title %>",
  "description": "<%= description %>",
  "$schema": "https://json.schemastore.org/youtrack-app.json",
  "vendor": {
    "name": "<%= vendor || 'Your Company' %>",
    "url": "<%= vendorUrl || 'https://example.com' %>"
  },
  "icon": "icon.svg",
  "widgets": [
    {
      "key": "enhanced-dx",
      "name": "Enhanced DX",
      "indexPath": "enhanced-dx/index.html",
      "extensionPoint": "MAIN_MENU_ITEM",
      "iconPath": "enhanced-dx/widget-icon.svg",
      "description": "description"
    }
  ]
}

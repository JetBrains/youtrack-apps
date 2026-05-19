---
to: "src/settings.json"
---
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "<%= title %> Settings",
  "description": "Configuration for <%= title %>",
  "properties": {
    "enableFeature": {
      "type": "boolean",
      "title": "Enable Feature",
      "description": "Enable or disable the main feature",
      "default": true
    }
  }
}

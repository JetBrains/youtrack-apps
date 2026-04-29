---
to: "@types/youtrack-scripting.d.ts"
---
// Maps @jetbrains/youtrack-scripting-api/* to the TypeScript stubs bundled with
// @jetbrains/youtrack-enhanced-dx-tools. Backend scripts import from the scripting-api
// paths so Rollup externalises them; YouTrack provides the runtime modules.

declare module '@jetbrains/youtrack-scripting-api/entities' {
  export * from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-types';
}

declare module '@jetbrains/youtrack-scripting-api/ai-tools' {
  export * from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api/ai-tools';
}

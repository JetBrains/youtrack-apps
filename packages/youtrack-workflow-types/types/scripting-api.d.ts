/*
 Copyright 2017 JetBrains s.r.o.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0
 */

/**
 * Ambient module declarations that map the runtime
 * `@jetbrains/youtrack-scripting-api/*` import specifiers used by YouTrack
 * workflow code at runtime to the type definitions shipped in this package.
 *
 * Opt in by adding the path to your tsconfig:
 *
 *   {
 *     "compilerOptions": {
 *       "types": ["@jetbrains/youtrack-workflow-types/scripting-api"]
 *     }
 *   }
 *
 * Once enabled, the following statements receive proper types without
 * any explicit import from `@jetbrains/youtrack-workflow-types`:
 *
 *   const entities = require('@jetbrains/youtrack-scripting-api/entities');
 *   import type { Issue } from '@jetbrains/youtrack-scripting-api/entities';
 */

declare module '@jetbrains/youtrack-scripting-api/entities' {
  export * from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';
}

declare module '@jetbrains/youtrack-scripting-api/apps' {
  export * from '@jetbrains/youtrack-workflow-types/apps';
}

declare module '@jetbrains/youtrack-scripting-api/workflow' {
  export * from '@jetbrains/youtrack-workflow-types/workflow';
}

declare module '@jetbrains/youtrack-scripting-api/http' {
  export * from '@jetbrains/youtrack-workflow-types/http';
}

declare module '@jetbrains/youtrack-scripting-api/date-time' {
  export * from '@jetbrains/youtrack-workflow-types/date-time';
}

declare module '@jetbrains/youtrack-scripting-api/search' {
  export * from '@jetbrains/youtrack-workflow-types/search';
}

declare module '@jetbrains/youtrack-scripting-api/packages' {
  export * from '@jetbrains/youtrack-workflow-types/packages';
}

declare module '@jetbrains/youtrack-scripting-api/utility-types' {
  export * from '@jetbrains/youtrack-workflow-types/utility-types';
}

declare module '@jetbrains/youtrack-scripting-api/license' {
  export * from '@jetbrains/youtrack-workflow-types/license';
}

declare module '@jetbrains/youtrack-scripting-api/ai-tools' {
  export * from '@jetbrains/youtrack-workflow-types/ai-tools';
}

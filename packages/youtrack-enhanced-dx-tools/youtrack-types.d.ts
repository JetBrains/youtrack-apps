/**
 * @deprecated This file is deprecated. Use @jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api instead.
 *
 * Import from the new workflow API:
 * ```typescript
 * import type { Issue, Project, User } from '@jetbrains/youtrack-enhanced-dx-tools/youtrack-workflow-api';
 * ```
 *
 * The new workflow API provides:
 * - More accurate type definitions (classes instead of interfaces)
 * - Complete entity hierarchy with proper inheritance
 * - Official YouTrack workflow API stubs
 * - AppTypeRegistry for type-safe app settings
 * - 63 entity classes with full documentation
 *
 * This file will be removed in a future version.
 */

// Re-export from the new workflow API for backward compatibility
export * from './youtrack-workflow-api/workflowTypeScriptStubs.js';

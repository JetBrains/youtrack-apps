/*
 Copyright 2017 JetBrains s.r.o.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Type definitions for YouTrack AI Tools.
 * @module @jetbrains/youtrack-scripting-api/ai-tools
 */

import type { Issue, User } from './workflowTypeScriptStubs.js';
import type { JSONSchema } from './utility-types.js';

// =============================================================================
// AI Tool Annotations
// =============================================================================

/**
 * Annotations provide hints about tool behavior for the AI and UI.
 */
export interface AIToolAnnotations {
  /**
   * Human-readable title for the tool (displayed in UI).
   */
  title?: string;

  /**
   * Indicates the tool only reads data and doesn't modify state.
   * Helps AI understand when the tool is safe to call speculatively.
   * @default false
   */
  readOnlyHint?: boolean;

  /**
   * Indicates the tool may perform destructive operations.
   * AI should exercise caution before calling such tools.
   * @default false
   */
  destructiveHint?: boolean;

  /**
   * Indicates multiple calls with same arguments produce same result.
   * Helps AI avoid redundant calls.
   * @default false
   */
  idempotentHint?: boolean;

  /**
   * Indicates the result should be returned directly to user.
   * If true, AI should not summarize or process the output further.
   * @default false
   */
  returnDirect?: boolean;

  /**
   * Indicates this tool requires user confirmation before execution.
   * @default false
   */
  requiresConfirmation?: boolean;
}

// =============================================================================
// AI Tool Context
// =============================================================================

/**
 * Context available to AI tool execute function.
 */
export interface AIToolContext<TArgs = Record<string, unknown>> {
  /**
   * Input arguments parsed according to inputSchema.
   * Type is inferred from the inputSchema if using json-schema-to-ts.
   */
  readonly arguments: TArgs;

  /**
   * Current user invoking the AI tool.
   */
  readonly currentUser: User;

  /**
   * Issue in context, if available (depends on where tool is invoked).
   */
  readonly issue?: Issue;
}

// =============================================================================
// AI Tool Definition
// =============================================================================

/**
 * AI tool definition for export from backend script.
 *
 * @example
 * ```javascript
 * exports.aiTool = {
 *   name: 'search_issues',
 *   description: 'Search for issues using YouTrack query syntax',
 *   inputSchema: {
 *     type: 'object',
 *     properties: {
 *       query: { type: 'string', description: 'Search query' }
 *     },
 *     required: ['query']
 *   },
 *   execute: (ctx) => {
 *     return search.search(null, ctx.arguments.query);
 *   }
 * };
 * ```
 */
export interface AITool<
  TArgs = Record<string, unknown>,
  TResult = unknown
> {
  /**
   * Unique name for the tool (used by AI to invoke it).
   * Should be snake_case for compatibility with AI models.
   */
  name: string;

  /**
   * Description of what the tool does.
   * This is shown to the AI to help it decide when to use the tool.
   * Be clear and specific about capabilities and limitations.
   */
  description: string;

  /**
   * JSON Schema describing the input arguments.
   * If not provided, the tool takes no arguments.
   */
  inputSchema?: JSONSchema;

  /**
   * JSON Schema describing the output.
   * Helps AI understand what to expect from the tool.
   */
  outputSchema?: JSONSchema;

  /**
   * Annotations providing hints about tool behavior.
   */
  annotations?: AIToolAnnotations;

  /**
   * Execute function that performs the tool's action.
   * @param ctx Context containing arguments and other contextual info
   * @returns Result to return to AI (will be JSON serialized)
   */
  execute: (ctx: AIToolContext<TArgs>) => TResult | Promise<TResult>;
}

// =============================================================================
// Type-Safe AI Tool Factory
// =============================================================================

/**
 * Creates a type-safe AI tool with inferred argument types.
 *
 * Usage with json-schema-to-ts:
 * ```typescript
 * import { FromSchema } from 'json-schema-to-ts';
 *
 * const inputSchema = {
 *   type: 'object',
 *   properties: {
 *     query: { type: 'string' }
 *   },
 *   required: ['query']
 * } as const;
 *
 * type Args = FromSchema<typeof inputSchema>;
 *
 * export const aiTool = defineAITool<Args, Issue[]>({
 *   name: 'search_issues',
 *   description: 'Search issues',
 *   inputSchema,
 *   execute: (ctx) => {
 *     // ctx.arguments is typed as Args
 *     return search.search(null, ctx.arguments.query);
 *   }
 * });
 * ```
 */
export function defineAITool<TArgs = Record<string, unknown>, TResult = unknown>(
  tool: AITool<TArgs, TResult>
): AITool<TArgs, TResult>;

// =============================================================================
// Common AI Tool Patterns
// =============================================================================

/**
 * AI tool that only reads data (helper type).
 */
export type ReadOnlyAITool<TArgs = Record<string, unknown>, TResult = unknown> =
  AITool<TArgs, TResult> & {
    annotations: { readOnlyHint: true };
  };

/**
 * AI tool that modifies data (helper type).
 */
export type MutatingAITool<TArgs = Record<string, unknown>, TResult = unknown> =
  AITool<TArgs, TResult> & {
    annotations: { readOnlyHint: false };
  };

/**
 * AI tool that requires confirmation (helper type).
 */
export type ConfirmableAITool<TArgs = Record<string, unknown>, TResult = unknown> =
  AITool<TArgs, TResult> & {
    annotations: { requiresConfirmation: true };
  };

// =============================================================================
// AI Tool Error Types
// =============================================================================

/**
 * Error thrown when AI tool execution fails.
 */
export interface AIToolError {
  /**
   * Error message.
   */
  message: string;

  /**
   * Error code for programmatic handling.
   */
  code?: string;

  /**
   * Additional details about the error.
   */
  details?: Record<string, unknown>;
}

/**
 * Result type for AI tools that may fail.
 */
export type AIToolResult<T> =
  | { success: true; data: T }
  | { success: false; error: AIToolError };

// =============================================================================
// AI Tool Collection
// =============================================================================

/**
 * Multiple AI tools exported from a single file.
 */
export interface AIToolCollection {
  [toolName: string]: AITool;
}

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

import type { Issue, User, AppGlobalStorage, AsyncStoreValue } from './workflowTypeScriptStubs.js';
import type { JSONSchema } from './utility-types.js';
// Import HTTP Response type for use as the async HTTP response shape in
// asyncFunctions called as `connection.*Async(..., 'handlerName')` callbacks.
import type { Response } from './http.js';
// AI tools share AppTypeRegistry with apps for settings + globalStorage
// extension property types.
import type { AppTypeRegistry } from './apps.js';

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
 *
 * Carries AK / S generics so `ctx.invokeAsync` / `ctx.store` / `ctx.load`
 * are typed against the parent tool's `asyncFunctions` keys and store schema,
 * matching the rule-side `ActionContext<R, AK, S>` pattern.
 *
 * @template TArgs - Input arguments shape parsed from the tool's inputSchema.
 * @template S - Optional store schema. Default loose.
 * @template AK - Union of asyncFunctions key names declared on the parent tool.
 * @template TSettings - App settings type. Defaults to AppTypeRegistry['settings'].
 * @template TGlobalStorageExtensions - AppGlobalStorage extension properties.
 *   Defaults to AppTypeRegistry['appGlobalStorageExtensions'].
 */
export interface AIToolContext<
  TArgs = Record<string, unknown>,
  TSettings = AppTypeRegistry['settings'],
  TGlobalStorageExtensions = AppTypeRegistry['appGlobalStorageExtensions'],
  AK extends string = string,
  S extends Record<keyof S, AsyncStoreValue> = Record<string, any>
> {
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

  /**
   * App settings as key-value pairs. Same shape as `BaseHttpContext.settings`.
   */
  readonly settings: TSettings;

  /**
   * The app-level global storage entity. Use
   * `ctx.globalStorage.extensionProperties.X` to read/write app-global
   * values defined in the app's `entity-extensions.json`.
   */
  readonly globalStorage: AppGlobalStorage & { extensionProperties: TGlobalStorageExtensions };

  /**
   * Schedules an async function for execution after the current transaction
   * commits. `functionName` is constrained to the AK union — keys declared
   * in the parent tool's `asyncFunctions`.
   *
   * @param functionName The name of a function declared in `asyncFunctions`.
   * @param delay Optional delay in milliseconds (default 0, max 7 days).
   * @param deduplicationKey Optional debounce key.
   */
  invokeAsync(functionName: AK, delay?: number, deduplicationKey?: string): void;

  /**
   * Persists a value across async boundaries. When a store schema `S` is
   * supplied, key/value are checked against it.
   */
  store<K extends keyof S>(key: K, value: S[K]): void;

  /**
   * Retrieves a value previously stored with `ctx.store(key, value)`.
   * Returns `S[K] | undefined`.
   */
  load<K extends keyof S>(key: K): S[K] | undefined;
}

/**
 * Context passed to async functions declared in an AI tool's `asyncFunctions`
 * block.
 *
 * The function may be invoked via `ctx.invokeAsync('name', delay)` from the
 * tool's `execute` (or another async function), or as the response callback
 * of `connection.*Async(..., 'name')`. In the latter case `response` is
 * populated with the incoming HTTP response.
 */
export interface AIToolAsyncFunctionContext<
  TSettings = AppTypeRegistry['settings'],
  TGlobalStorageExtensions = AppTypeRegistry['appGlobalStorageExtensions'],
  AK extends string = string,
  S extends Record<keyof S, AsyncStoreValue> = Record<string, any>
> {
  /**
   * Current user under which the async function executes — captured at
   * scheduling time.
   */
  readonly currentUser: User;

  /**
   * App settings as key-value pairs. Same shape as `AIToolContext.settings`.
   */
  readonly settings: TSettings;

  /**
   * The app-level global storage entity. Use
   * `ctx.globalStorage.extensionProperties.X` to read/write app-global
   * values defined in the app's `entity-extensions.json`.
   */
  readonly globalStorage: AppGlobalStorage & { extensionProperties: TGlobalStorageExtensions };

  /**
   * Issue in context, if the tool was invoked with an issue and the value
   * was carried into the async chain.
   */
  readonly issue?: Issue;

  /**
   * The HTTP response returned by the async HTTP call that triggered this
   * function (e.g. `connection.postAsync(..., 'onResponse')`). `undefined`
   * when the function was scheduled via `ctx.invokeAsync`.
   *
   * Body is truncated by the runtime at 1 MB.
   */
  readonly response?: Response;

  /**
   * Schedules another async function for execution. `functionName` is
   * constrained to the AK union (keys declared in the parent tool's
   * `asyncFunctions`).
   */
  invokeAsync(functionName: AK, delay?: number, deduplicationKey?: string): void;

  /**
   * Persists a value to be retrieved later with `ctx.load(key)`.
   * Typed against schema S.
   */
  store<K extends keyof S>(key: K, value: S[K]): void;

  /**
   * Retrieves a value stored earlier in the same async chain.
   * Returns `S[K] | undefined`.
   */
  load<K extends keyof S>(key: K): S[K] | undefined;
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
  TResult = unknown,
  TSettings = AppTypeRegistry['settings'],
  TGlobalStorageExtensions = AppTypeRegistry['appGlobalStorageExtensions'],
  AK extends string = string,
  S extends Record<keyof S, AsyncStoreValue> = Record<string, any>
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
   * Execute function that performs the tool's action. Ctx generics carry the
   * AK / S from the parent tool so `ctx.invokeAsync` / `ctx.store` /
   * `ctx.load` are typed against the tool's `asyncFunctions` keys and
   * store schema.
   *
   * @param ctx Context containing arguments and other contextual info
   * @returns Result to return to AI (will be JSON serialized)
   */
  execute: (ctx: AIToolContext<TArgs, TSettings, TGlobalStorageExtensions, AK, S>) => TResult | Promise<TResult>;

  /**
   * Named async functions invoked after the tool's `execute` transaction
   * commits. The keys of this record become the AK union — `ctx.invokeAsync`
   * accepts only declared names. Use the `withStore<TArgs, TResult, S>()` curry
   * from `@jetbrains/youtrack-apps-tools` to also type `ctx.store` / `ctx.load`.
   *
   * Constraints enforced by the runtime: one async call per execution, max
   * chain length 10 hops, max delay 1 week.
   *
   * @see {@link https://github.com/JetBrains/youtrack/blob/main/docs/apps-workflows/async-functions.md}
   */
  asyncFunctions?: Record<
    AK,
    (ctx: AIToolAsyncFunctionContext<TSettings, TGlobalStorageExtensions, AK, S>) => void
  >;
}

// =============================================================================
// Authoring a Type-Safe AI Tool
// =============================================================================

/**
 * This module is type-only — there is no runtime factory to call. Author an
 * AI tool with one of these patterns:
 *
 *   1. **Plain tool** — annotate or `satisfies` to type arguments + result:
 *      `const aiTool = {...} satisfies AITool<{ query: string }, Issue[]>;`
 *   2. **Async / typed store** — the `withStore<TArgs, TResult, S>()({...})`
 *      curry from `@jetbrains/youtrack-apps-tools` (a runtime identity helper).
 *      It types `ctx.store` / `ctx.load` against `S` and infers the `AK` union
 *      from the `asyncFunctions` literal.
 *
 * @example
 * ```typescript
 * import { withStore } from '@jetbrains/youtrack-apps-tools/dx/runtime';
 *
 * exports.aiTool = withStore<{ query: string }, string, { last: string }>()({
 *   name: 'search_issues', description: 'Search issues',
 *   execute: (ctx) => {
 *     ctx.store('last', ctx.arguments.query);
 *     ctx.invokeAsync('onDone');
 *     return 'ok';
 *   },
 *   asyncFunctions: { onDone: (ctx) => { console.log(ctx.load('last')); } }
 * });
 * ```
 */

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

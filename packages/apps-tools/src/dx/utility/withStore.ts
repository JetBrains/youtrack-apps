import type { HttpHandler, HttpAsyncFunctionContext, AppTypeRegistry } from '@jetbrains/youtrack-workflow-types/apps';
import type { AITool, AIToolAsyncFunctionContext } from '@jetbrains/youtrack-workflow-types/ai-tools';
import type { AsyncStoreValue } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';

/**
 * Curry helper for the async-functions surface. First call binds the store
 * schema (and, for AI tools, the argument/result types); the returned
 * function has no explicit generics, so AK is inferred from the
 * `asyncFunctions` literal — both narrowings active in a single bare call
 * site, no manual key union required.
 *
 * Sidesteps the TS partial-inference limit: annotating the handler/tool type
 * directly (or `satisfies HttpHandler<...>` / `satisfies AITool<...>`) cannot
 * infer AK, so the caller would have to spell out the async key union by hand.
 * The curry binds the store schema first, then infers AK from `asyncFunctions`.
 *
 * Two overloads, selected by generic arg count:
 *   - `withStore<S>()` → HTTP handler curry
 *   - `withStore<TArgs, TResult, S>()` → AI tool curry (binds `TArgs`/`TResult`
 *     explicitly to avoid the inference foot-gun where they would silently
 *     fall back to `Record<string, unknown>`)
 *
 * @example
 * ```typescript
 * import { withStore } from '@jetbrains/youtrack-apps-tools/dx/runtime';
 *
 * type MyStore = { count: number; label: string };
 *
 * // HTTP handler:
 * exports.httpHandler = withStore<MyStore>()({
 *   endpoints: [{
 *     scope: 'global', method: 'POST', path: '/tick',
 *     handle: (ctx) => {
 *       ctx.store('count', 1);                // typed: number
 *       ctx.invokeAsync('onTick');            // narrowed
 *       ctx.response.json({});
 *     }
 *   }],
 *   asyncFunctions: {
 *     onTick: (ctx) => { console.log(ctx.load('count')); },
 *     onDone: (ctx) => { console.log(ctx); }
 *   }
 * });
 *
 * // AI tool:
 * type Args = { query: string };
 * exports.aiTool = withStore<Args, string, MyStore>()({
 *   name: 'search', description: 'd',
 *   execute: (ctx) => {
 *     ctx.store('label', ctx.arguments.query);
 *     ctx.invokeAsync('onResult');
 *     return 'ok';
 *   },
 *   asyncFunctions: { onResult: (ctx) => { console.log(ctx.load('label')); } }
 * });
 * ```
 */
export function withStore<S extends Record<keyof S, AsyncStoreValue>>(): <
  AK extends string,
  TSettings = AppTypeRegistry['settings'],
  TIssueExtensions = AppTypeRegistry['issueExtensions'],
  TProjectExtensions = AppTypeRegistry['projectExtensions'],
  TArticleExtensions = AppTypeRegistry['articleExtensions'],
  TUserExtensions = AppTypeRegistry['userExtensions'],
  TGlobalStorageExtensions = AppTypeRegistry['appGlobalStorageExtensions']
>(
  handler: HttpHandler<TSettings, TIssueExtensions, TProjectExtensions, TArticleExtensions, TUserExtensions, TGlobalStorageExtensions, AK, S>
    & { asyncFunctions: Record<AK, (ctx: HttpAsyncFunctionContext<TSettings, TIssueExtensions, TProjectExtensions, TArticleExtensions, TUserExtensions, TGlobalStorageExtensions, AK, S>) => void> }
) => HttpHandler<TSettings, TIssueExtensions, TProjectExtensions, TArticleExtensions, TUserExtensions, TGlobalStorageExtensions, AK, S>;
export function withStore<TArgs, TResult, S extends Record<keyof S, AsyncStoreValue>>(): <
  AK extends string,
  TSettings = AppTypeRegistry['settings'],
  TGlobalStorageExtensions = AppTypeRegistry['appGlobalStorageExtensions']
>(
  tool: AITool<TArgs, TResult, TSettings, TGlobalStorageExtensions, AK, S>
    & { asyncFunctions: Record<AK, (ctx: AIToolAsyncFunctionContext<TSettings, TGlobalStorageExtensions, AK, S>) => void> }
) => AITool<TArgs, TResult, TSettings, TGlobalStorageExtensions, AK, S>;
export function withStore(): <T>(input: T) => T {
  return input => input;
}
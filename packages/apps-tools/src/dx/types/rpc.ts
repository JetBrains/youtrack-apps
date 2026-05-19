import type { CtxGet, CtxPost, CtxPut, CtxDelete, ScopeCtx } from './ctx.js';

/**
 * Extracts RPC signature from a handler function.
 * Supports all scope types (issue, project, article, user, global) and HTTP methods (GET, POST, PUT, DELETE).
 *
 * **Note:** All API methods return Promises, as they involve network requests to YouTrack.
 *
 * @template T - Handler function type
 *
 * @example
 * ```typescript
 * // For a GET handler with response and query
 * type Handler = (ctx: CtxGetProject<MyResponse, MyQuery>) => void;
 * type RPC = ExtractRPCFromHandler<Handler>; // (query?: Partial<MyQuery>) => Promise<MyResponse>
 *
 * // For a POST handler with body, response, and query
 * type Handler = (ctx: CtxPostIssue<MyBody, MyResponse, MyQuery>) => void;
 * type RPC = ExtractRPCFromHandler<Handler>; // (body: MyBody, query?: Partial<MyQuery>) => Promise<MyResponse>
 * ```
 */
export type ExtractRPCFromHandler<T> =
  T extends (ctx: infer Ctx) => void
    ? Ctx extends CtxPost<infer Body, infer Res, infer Query, ScopeCtx> | CtxPut<infer Body, infer Res, infer Query, ScopeCtx>
      ? (body: Body, query?: Partial<Query>) => Promise<Res>
      : Ctx extends CtxGet<infer Res, infer Query, ScopeCtx> | CtxDelete<infer Res, infer Query, ScopeCtx>
        ? (query?: Partial<Query>) => Promise<Res>
        : never
    : never;

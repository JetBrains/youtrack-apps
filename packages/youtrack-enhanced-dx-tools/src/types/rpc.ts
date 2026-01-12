import type {
  CtxGet,
  CtxPost,
  CtxPut,
  CtxDelete,
  CtxGetIssue,
  CtxPostIssue,
  CtxPutIssue,
  CtxDeleteIssue,
  CtxGetProject,
  CtxPostProject,
  CtxPutProject,
  CtxDeleteProject,
  CtxGetArticle,
  CtxPostArticle,
  CtxPutArticle,
  CtxDeleteArticle,
  CtxGetUser,
  CtxPostUser,
  CtxPutUser,
  CtxDeleteUser,
  CtxGetGlobal,
  CtxPostGlobal,
  CtxPutGlobal,
  CtxDeleteGlobal,
} from './ctx.js';

/**
 * Union type of all POST context types
 */
type AllCtxPost =
  | CtxPost<any, any, any, any>
  | CtxPostIssue<any, any, any>
  | CtxPostProject<any, any, any>
  | CtxPostArticle<any, any, any>
  | CtxPostUser<any, any, any>
  | CtxPostGlobal<any, any, any>;

/**
 * Union type of all PUT context types
 */
type AllCtxPut =
  | CtxPut<any, any, any, any>
  | CtxPutIssue<any, any, any>
  | CtxPutProject<any, any, any>
  | CtxPutArticle<any, any, any>
  | CtxPutUser<any, any, any>
  | CtxPutGlobal<any, any, any>;

/**
 * Union type of all GET context types
 */
type AllCtxGet =
  | CtxGet<any, any, any>
  | CtxGetIssue<any, any>
  | CtxGetProject<any, any>
  | CtxGetArticle<any, any>
  | CtxGetUser<any, any>
  | CtxGetGlobal<any, any>;

/**
 * Union type of all DELETE context types
 */
type AllCtxDelete =
  | CtxDelete<any, any, any>
  | CtxDeleteIssue<any, any>
  | CtxDeleteProject<any, any>
  | CtxDeleteArticle<any, any>
  | CtxDeleteUser<any, any>
  | CtxDeleteGlobal<any, any>;

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
    ? Ctx extends AllCtxPost | AllCtxPut
      ? Ctx extends CtxPost<infer Body, infer Res, infer Query, any> | CtxPut<infer Body, infer Res, infer Query, any>
        ? (body: Body, query?: Partial<Query>) => Promise<Res>
        : never
      : Ctx extends AllCtxGet | AllCtxDelete
        ? Ctx extends CtxGet<infer Res, infer Query, any> | CtxDelete<infer Res, infer Query, any>
          ? (query?: Partial<Query>) => Promise<Res>
          : never
        : never
    : never;

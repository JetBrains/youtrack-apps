---
to: "src/backend/types/utility.d.ts"
---
/**
 * Extracts RPC signature from HTTP handler function.
 * Converts handler context types to client-callable functions with Promise return types.
 * 
 * @template T - Handler function type
 * @returns Function signature for the generated API client
 * 
 * @example
 * // Backend handler
 * export default function handle(ctx: CtxPost<CreateBody, Response>) { ... }
 * export type Handle = typeof handle;
 * 
 * // Generated API client method
 * api.global.create: (body: CreateBody, query?: Partial<{}>) => Promise<Response>
 */
export type ExtractRPCFromHandler<T> = T extends (
  ctx: CtxPost<infer Body, infer Res, infer Query, string> | CtxPut<infer Body, infer Res, infer Query, string>
) => void
  ? (body: Body, query?: Partial<Query>) => Promise<Res>
  : T extends (ctx: CtxGet<infer Res, infer Query, string> | CtxDelete<infer Res, infer Query, string>) => void
    ? (query?: Partial<Query>) => Promise<Res>
    : never;

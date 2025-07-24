---
to: "src/backend/types/utility.d.ts"
---
export type ExtractRPCFromHandler<T> =
    T extends (ctx: infer Ctx) => void
        ? Ctx extends CtxPost<infer Body, infer Res> | CtxPut<infer Body, infer Res>
            ? (body: Body, query?: Record<string, any>) => Res
            : Ctx extends CtxGet<infer Query, infer Res> | CtxDelete<infer Query, infer Res>
                ? (query?: Partial<Query>) => Res
                : never
        : never;

---
to: "src/backend/types/utility.d.ts"
---
export type ExtractRPCFromHandler<T> =
    T extends (ctx: infer Ctx) => void
        ? Ctx extends CtxPost<infer Body, infer Res, infer Query> | CtxPut<infer Body, infer Res, infer Query>
            ? (body: Body, query?: Partial<Query>) => Res
            : Ctx extends CtxGet<infer Res, infer Query> | CtxDelete<infer Res, infer Query>
                ? (query?: Partial<Query>) => Res
                : never
        : never;

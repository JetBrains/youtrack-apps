---
to: "src/backend/types/utility.d.ts"
---
type AllCtxPost =
  | CtxPost<any, any, any, any>
  | CtxPostIssue<any, any, any>
  | CtxPostProject<any, any, any>
  | CtxPostArticle<any, any, any>
  | CtxPostUser<any, any, any>;

type AllCtxPut =
  | CtxPut<any, any, any, any>
  | CtxPutIssue<any, any, any>
  | CtxPutProject<any, any, any>
  | CtxPutArticle<any, any, any>
  | CtxPutUser<any, any, any>;

type AllCtxGet =
  | CtxGet<any, any, any>
  | CtxGetIssue<any, any>
  | CtxGetProject<any, any>
  | CtxGetArticle<any, any>
  | CtxGetUser<any, any>;

type AllCtxDelete =
  | CtxDelete<any, any, any>
  | CtxDeleteIssue<any, any>
  | CtxDeleteProject<any, any>
  | CtxDeleteArticle<any, any>
  | CtxDeleteUser<any, any>;

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

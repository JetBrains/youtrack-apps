export { default as youtrackApiGenerator } from './vite-plugin-youtrack-api-generator.js';
export { default as youtrackRouter } from './vite-plugin-youtrack-router.js';

// Export utility types
export type ExtractRPCFromHandler<T> =
    T extends (ctx: infer Ctx) => void
        ? Ctx extends CtxPost<infer Body, infer Res> | CtxPut<infer Body, infer Res>
            ? (body: Body, query?: Record<string, any>) => Res
            : Ctx extends CtxGet<infer Query, infer Res> | CtxDelete<infer Query, infer Res>
                ? (query?: Partial<Query>) => Res
                : never
        : never;

export type CtxPost<T = Record<string, unknown>, R = Record<string, unknown>> = {
    issue: any;
    request: {
      json: () => T;
    };
    response: {
      status?: number;
      json: (data: R) => void;
    };
    currentUser: any;
    project: any;
    settings: Record<string, unknown>;
};

export type CtxPut<T = Record<string, unknown>, R = Record<string, unknown>> = {
    issue: any;
    request: {
      json: () => T; // body payload
    };
    response: {
      status?: number;
      json: (data: R) => void;
    };
    currentUser: any;
    project: any;
    settings: Record<string, unknown>;
};

export type CtxGet<Q = Record<string, unknown>, R = Record<string, unknown>> = {
    issue: any;
    request: {
      query: Q;
      getParameter: (name: string) => string | undefined;
    };
    response: {
      status?: number;
      json: (data: R) => void;
    };
    currentUser: any;
    project: any;
    settings: Record<string, unknown>;
};

export type CtxDelete<Q = Record<string, unknown>, R = Record<string, unknown>> = {
    issue: any;
    request: {
      query: Q;
      getParameter: (name: string) => string | undefined;
    };
    response: {
      status?: number;
      json: (data: R) => void;
    };
    currentUser: any;
    project: any;
    settings: Record<string, unknown>;
};

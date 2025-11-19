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

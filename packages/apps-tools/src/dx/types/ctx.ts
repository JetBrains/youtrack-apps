import type { Issue, Project, Article, User } from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';
import type { AppTypeRegistry } from '@jetbrains/youtrack-workflow-types/apps';

/**
 * HTTP Request object properties and methods as per YouTrack HTTP Handler API
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-reference-http-handlers.html#request
 */
export type HttpRequest<TBody = unknown, TQuery = Record<string, unknown>> = {
  /** The request body as a string */
  body: string;
  /** A byte stream representation of the request body */
  bodyAsStream: unknown;
  /** A collection of request headers */
  headers: Array<{ name: string; value: string }>;
  /** The relative path to the endpoint. Equals endpoint.path */
  path: string;
  /** The full path to the endpoint */
  fullPath: string;
  /** The HTTP method that the request used. Can be either GET, POST, PUT, or DELETE */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** An array of the URL parameter names */
  parameterNames: Array<string>;
  /** Returns the request body in JSON format */
  json: () => TBody;
  /** Returns the URL parameter by its name */
  getParameter: (name: string) => string | undefined;
  /** Returns all URL parameters by the name as an array of strings */
  getParameters: (name: string) => Array<string>;
  /** Query parameters object */
  query: TQuery;
};

/**
 * HTTP Response object properties and methods as per YouTrack HTTP Handler API
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-reference-http-handlers.html#response
 */
export type HttpResponse<TResponse = unknown> = {
  /** The response body. If an exception occurs during processing, the response body is empty (null) */
  body: string | null;
  /** A byte stream representation of the response body. If an exception occurs during processing, the property is empty (null) */
  bodyAsStream: unknown | null;
  /** The HTTP status code that is assigned to the response. If an exception occurs during processing, the property is empty. 200 by default */
  code: number;
  /** Adds the Content-Type: application/json HTTP header to the response that the handler returns to the client */
  json: (object: TResponse) => void;
  /** Adds the Content-Type: text/plain HTTP header to the response that the handler returns to the client */
  text: (string: string) => HttpResponse;
  /** Adds an HTTP header to the response. If you pass null as the value, the corresponding header will be removed from the response */
  addHeader: (header: string, value: string | null) => HttpResponse;
  /** @deprecated Use code instead */
  status?: number;
};

/**
 * Base context type for HTTP handlers
 * Scope entities (issue, project, article, user) are available based on the endpoint scope
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-reference-http-handlers.html#scope
 */
export type BaseCtx = {
  /** Current user making the request */
  currentUser: User;
  /** App settings - typed via AppTypeRegistry augmentation */
  settings: AppTypeRegistry['settings'];
  /** Global storage extension properties - typed via AppTypeRegistry augmentation */
  globalStorage?: {
    extensionProperties?: AppTypeRegistry['appGlobalStorageExtensions'];
  };
};

/**
 * Context for issue-scoped endpoints
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-reference-http-handlers.html#scope
 */
export type IssueCtx = BaseCtx & {
  /** The issue entity for this scope */
  issue: Issue;
};

/**
 * Context for project-scoped endpoints
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-reference-http-handlers.html#scope
 */
export type ProjectCtx = BaseCtx & {
  /** The project entity for this scope */
  project: Project;
};

/**
 * Context for article-scoped endpoints
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-reference-http-handlers.html#scope
 */
export type ArticleCtx = BaseCtx & {
  /** The article entity for this scope */
  article: Article;
};

/**
 * Context for user-scoped endpoints
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-reference-http-handlers.html#scope
 */
export type UserCtx = BaseCtx & {
  /** The user entity for this scope */
  user: User;
};

/**
 * Context for global-scoped endpoints (no specific entity)
 * @see https://www.jetbrains.com/help/youtrack/devportal/apps-reference-http-handlers.html#scope
 */
export type GlobalCtx = BaseCtx;

/**
 * Union type of all possible scope contexts.
 * YouTrack HTTP handlers support five scopes: global, project, issue, article, and user.
 */
export type ScopeCtx = IssueCtx | ProjectCtx | ArticleCtx | UserCtx | GlobalCtx;

/**
 * Context type for POST requests (generic, supports all scopes)
 * @template TBody - Request body type
 * @template R - Response type
 * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
 * @template TScope - Scope context type (defaults to GlobalCtx)
 */
export type CtxPost<
  TBody = Record<string, unknown>,
  R = Record<string, unknown>,
  Q = Record<string, unknown>,
  TScope extends ScopeCtx = GlobalCtx
> = TScope & {
  request: HttpRequest<TBody, Q>;
  response: HttpResponse<R>;
};

/**
 * Context type for PUT requests (generic, supports all scopes)
 * @template TBody - Request body type
 * @template R - Response type
 * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
 * @template TScope - Scope context type (defaults to GlobalCtx)
 */
export type CtxPut<
  TBody = Record<string, unknown>,
  R = Record<string, unknown>,
  Q = Record<string, unknown>,
  TScope extends ScopeCtx = GlobalCtx
> = TScope & {
  request: HttpRequest<TBody, Q>;
  response: HttpResponse<R>;
};

/**
 * Context type for GET requests (generic, supports all scopes)
 * @template R - Response type
 * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
 * @template TScope - Scope context type (defaults to GlobalCtx)
 */
export type CtxGet<
  R = Record<string, unknown>,
  Q = Record<string, unknown>,
  TScope extends ScopeCtx = GlobalCtx
> = TScope & {
  request: HttpRequest<never, Q>;
  response: HttpResponse<R>;
};

/**
 * Context type for DELETE requests (generic, supports all scopes)
 * @template R - Response type
 * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
 * @template TScope - Scope context type (defaults to GlobalCtx)
 */
export type CtxDelete<
  R = Record<string, unknown>,
  Q = Record<string, unknown>,
  TScope extends ScopeCtx = GlobalCtx
> = TScope & {
  request: HttpRequest<never, Q>;
  response: HttpResponse<R>;
};

// Scope-specific type aliases for convenience

/**
 * Issue-scoped GET context
 */
export type CtxGetIssue<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, IssueCtx>;

/**
 * Issue-scoped POST context
 */
export type CtxPostIssue<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, IssueCtx>;

/**
 * Issue-scoped PUT context
 */
export type CtxPutIssue<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, IssueCtx>;

/**
 * Issue-scoped DELETE context
 */
export type CtxDeleteIssue<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, IssueCtx>;

/**
 * Project-scoped GET context
 */
export type CtxGetProject<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, ProjectCtx>;

/**
 * Project-scoped POST context
 */
export type CtxPostProject<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, ProjectCtx>;

/**
 * Project-scoped PUT context
 */
export type CtxPutProject<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, ProjectCtx>;

/**
 * Project-scoped DELETE context
 */
export type CtxDeleteProject<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, ProjectCtx>;

/**
 * Article-scoped GET context
 */
export type CtxGetArticle<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, ArticleCtx>;

/**
 * Article-scoped POST context
 */
export type CtxPostArticle<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, ArticleCtx>;

/**
 * Article-scoped PUT context
 */
export type CtxPutArticle<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, ArticleCtx>;

/**
 * Article-scoped DELETE context
 */
export type CtxDeleteArticle<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, ArticleCtx>;

/**
 * User-scoped GET context
 */
export type CtxGetUser<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, UserCtx>;

/**
 * User-scoped POST context
 */
export type CtxPostUser<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, UserCtx>;

/**
 * User-scoped PUT context
 */
export type CtxPutUser<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, UserCtx>;

/**
 * User-scoped DELETE context
 */
export type CtxDeleteUser<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, UserCtx>;

/**
 * Global-scoped GET context
 */
export type CtxGetGlobal<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, GlobalCtx>;

/**
 * Global-scoped POST context
 */
export type CtxPostGlobal<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, GlobalCtx>;

/**
 * Global-scoped PUT context
 */
export type CtxPutGlobal<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, GlobalCtx>;

/**
 * Global-scoped DELETE context
 */
export type CtxDeleteGlobal<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, GlobalCtx>;

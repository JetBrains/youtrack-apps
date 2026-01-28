---
to: "src/backend/types/backend.global.d.ts"
---
import {Project, Issue, User} from "@/api/youtrack-types";
import {ExtendedProperties} from "@/api/extended-entities";

type ExtendedIssue = ExtendedProperties['Issue'] extends never ? Issue : ExtendedProperties['Issue'];
type ExtendedProject = ExtendedProperties['Project'] extends never ? Project : ExtendedProperties['Project'];
type ExtendedArticle = ExtendedProperties['Article'] extends never ? any : ExtendedProperties['Article'];
type ExtendedUser = ExtendedProperties['User'] extends never ? User : ExtendedProperties['User'];
type AppGlobalStorageExtensionProperties = ExtendedProperties['AppGlobalStorage'] extends never ? Record<string, unknown> : ExtendedProperties['AppGlobalStorage'];

type HttpResponse<R = unknown> = {
  /** Response body content (null if exception occurs during processing) */
  body: string | null;
  /** Byte stream representation of response body (null if exception occurs during processing) */
  bodyAsStream: unknown | null;
  /** HTTP status code (default: 200) */
  code: number;
  /**
   * Converts response to JSON string and adds Content-Type: application/json header
   * @param object - Object to serialize as JSON
   */
  json: (object: R) => void;
  /**
   * Converts response to plain text string and adds Content-Type: text/plain header
   * @param string - Text content
   * @returns The response object for chaining
   */
  text: (string: string) => HttpResponse<R>;
  /**
   * Adds a custom HTTP header to the response
   * If value is null, removes the corresponding header
   * If multiple headers with the same name are added, only the last one is kept
   * @param header - Header name
   * @param value - Header value (null to remove)
   * @returns The response object for chaining
   */
  addHeader: (header: string, value: string | null) => HttpResponse<R>;
  /** @deprecated Use code instead */
  status?: number;
};

type HttpRequest<TBody = unknown, Q = Record<string, unknown>> = {
  body: string;
  bodyAsStream: unknown;
  headers: Array<{ name: string; value: string }>;
  path: string;
  fullPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  parameterNames: Array<string>;
  json: () => TBody;
  getParameter: (name: string) => string | undefined;
  getParameters: (name: string) => Array<string>;
  query: Q;
};

type BaseCtx = {
  currentUser: User;
  settings: AppSettings;
  globalStorage?: {
    extensionProperties?: AppGlobalStorageExtensionProperties;
  };
};

type IssueCtx = BaseCtx & {
  issue: ExtendedIssue;
};

type ProjectCtx = BaseCtx & {
  project: ExtendedProject;
};

type ArticleCtx = BaseCtx & {
  article: ExtendedArticle;
};

type UserCtx = BaseCtx & {
  user: ExtendedUser;
};

type GlobalCtx = BaseCtx;

type ScopeCtx = IssueCtx | ProjectCtx | ArticleCtx | UserCtx | GlobalCtx;

declare global {
  type AppSettings = Record<string, unknown> & {
    // Add your app-specific settings here
    // Example:
    // someProject?: string | unknown;
    // someFieldName?: string;
    // customLinkType?: string;
  };

  /**
   * Context type for POST requests
   * @template TBody - Request body type
   * @template R - Response type
   * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
   * @template TScope - Scope context type (defaults to GlobalCtx)
   */
  type CtxPost<
    TBody = Record<string, unknown>,
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    TScope extends ScopeCtx = GlobalCtx
  > = TScope & {
    request: HttpRequest<TBody, Q>;
    response: HttpResponse<R>;
  };

  /**
   * Context type for PUT requests
   * @template TBody - Request body type
   * @template R - Response type
   * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
   * @template TScope - Scope context type (defaults to GlobalCtx)
   */
  type CtxPut<
    TBody = Record<string, unknown>,
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    TScope extends ScopeCtx = GlobalCtx
  > = TScope & {
    request: HttpRequest<TBody, Q>;
    response: HttpResponse<R>;
  };

  /**
   * Context type for GET requests
   * @template R - Response type
   * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
   * @template TScope - Scope context type (defaults to GlobalCtx)
   */
  type CtxGet<
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    TScope extends ScopeCtx = GlobalCtx
  > = TScope & {
    request: HttpRequest<never, Q>;
    response: HttpResponse<R>;
  };

  /**
   * Context type for DELETE requests
   * @template R - Response type
   * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
   * @template TScope - Scope context type (defaults to GlobalCtx)
   */
  type CtxDelete<
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    TScope extends ScopeCtx = GlobalCtx
  > = TScope & {
    request: HttpRequest<never, Q>;
    response: HttpResponse<R>;
  };

  // Convenience type aliases for specific scopes
  type CtxGetIssue<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, IssueCtx>;
  type CtxPostIssue<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, IssueCtx>;
  type CtxPutIssue<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, IssueCtx>;
  type CtxDeleteIssue<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, IssueCtx>;

  type CtxGetProject<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, ProjectCtx>;
  type CtxPostProject<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, ProjectCtx>;
  type CtxPutProject<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, ProjectCtx>;
  type CtxDeleteProject<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, ProjectCtx>;

  type CtxGetArticle<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, ArticleCtx>;
  type CtxPostArticle<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, ArticleCtx>;
  type CtxPutArticle<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, ArticleCtx>;
  type CtxDeleteArticle<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, ArticleCtx>;

  type CtxGetUser<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxGet<R, Q, UserCtx>;
  type CtxPostUser<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPost<TBody, R, Q, UserCtx>;
  type CtxPutUser<TBody = Record<string, unknown>, R = Record<string, unknown>, Q = Record<string, unknown>> = CtxPut<TBody, R, Q, UserCtx>;
  type CtxDeleteUser<R = Record<string, unknown>, Q = Record<string, unknown>> = CtxDelete<R, Q, UserCtx>;
}

//This is needed to make the file a module
export {};


---
to: "src/backend/types/backend.global.d.ts"
---
import {Project, Issue, User, Article} from "@/api/youtrack-types";
import {ExtendedProperties} from "@/api/extended-entities";

type ExtendedIssue = ExtendedProperties['Issue'] extends never ? Issue : ExtendedProperties['Issue'];
type ExtendedProject = ExtendedProperties['Project'] extends never ? Project : ExtendedProperties['Project'];
type ExtendedArticle = ExtendedProperties['Article'] extends never ? Article : ExtendedProperties['Article'];
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

/** Supported handler scope values */
type HttpHandlerScope = "issue" | "project" | "article" | "user" | "global";

declare global {
  /**
   * Base context available in all HTTP handlers.
   * Uses discriminated unions for scope-specific properties.
   * TypeScript automatically narrows the type when you check ctx.scope.
   *
   * @example
   * function handle(ctx: CtxGet<Response, Query, "issue">) {
   *   // ctx.issue is available and typed
   *   const issueId = ctx.issue.id;
   *
   *   // Or use type narrowing
   *   if (ctx.scope === "issue") {
   *     ctx.issue; // TypeScript knows this exists
   *   }
   * }
   */
  type Ctx = {
    currentUser: User;
    settings: AppSettings;
  } & (
    | {
        scope: "issue";
        issue: ExtendedIssue;
        project: ExtendedProject;
      }
    | {
        scope: "project";
        project: ExtendedProject;
      }
    | {
        scope: "article";
        article: ExtendedArticle;
      }
    | {
        scope: "user";
        user: ExtendedUser;
      }
    | {
        scope: "global";
        globalStorage: {
          extensionProperties: AppGlobalStorageExtensionProperties;
        };
      }
  );

  /**
   * Context type for POST requests
   * @template TBody - Request body type
   * @template R - Response type
   * @template Q - Query parameters type
   * @template S - Handler scope ("issue" | "project" | "article" | "user" | "global")
   *
   * @example
   * export default function handle(ctx: CtxPost<UpdateBody, Response, never, "issue">) {
   *   const body = ctx.request.json();
   *   ctx.response.json({ updated: true });
   * }
   */
  type CtxPost<
    TBody = Record<string, unknown>,
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    S extends HttpHandlerScope = HttpHandlerScope
  > = Extract<Ctx, { scope: S }> & {
    request: HttpRequest<TBody, Q>;
    response: HttpResponse<R>;
  };

  /**
   * Context type for PUT requests
   * @template TBody - Request body type
   * @template R - Response type
   * @template Q - Query parameters type
   * @template S - Handler scope
   */
  type CtxPut<
    TBody = Record<string, unknown>,
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    S extends HttpHandlerScope = HttpHandlerScope
  > = Extract<Ctx, { scope: S }> & {
    request: HttpRequest<TBody, Q>;
    response: HttpResponse<R>;
  };

  /**
   * Context type for GET requests
   * @template R - Response type
   * @template Q - Query parameters type
   * @template S - Handler scope
   */
  type CtxGet<
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    S extends HttpHandlerScope = HttpHandlerScope
  > = Extract<Ctx, { scope: S }> & {
    request: HttpRequest<never, Q>;
    response: HttpResponse<R>;
  };

  /**
   * Context type for DELETE requests
   * @template R - Response type
   * @template Q - Query parameters type
   * @template S - Handler scope
   */
  type CtxDelete<
    R = Record<string, unknown>,
    Q = Record<string, unknown>,
    S extends HttpHandlerScope = HttpHandlerScope
  > = Extract<Ctx, { scope: S }> & {
    request: HttpRequest<never, Q>;
    response: HttpResponse<R>;
  };
}

export {};


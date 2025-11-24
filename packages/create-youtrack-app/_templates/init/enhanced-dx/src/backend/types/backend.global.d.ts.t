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
   */
  type CtxPost<
    TBody = Record<string, unknown>,
    R = Record<string, unknown>,
    Q = Record<string, unknown>
  > = {
    /** Available when scope is 'issue' - automatically uses ExtendedIssue if extension properties are defined */
    issue?: ExtendedIssue;
    /** Available when scope is 'project' - automatically uses ExtendedProject if extension properties are defined */
    project?: ExtendedProject;
    /** Available when scope is 'article' - automatically uses ExtendedArticle if extension properties are defined */
    article?: ExtendedArticle;
    /** Available when scope is 'user' - automatically uses ExtendedUser if extension properties are defined */
    user?: ExtendedUser;
    /** Current user making the request */
    currentUser: User;
    /** App settings */
    settings: AppSettings;
    /** Global storage extension properties - automatically uses AppGlobalStorageExtensionProperties if defined */
    globalStorage?: {
      extensionProperties?: AppGlobalStorageExtensionProperties;
    };
    request: {
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
    response: HttpResponse<R>;
  };

  /**
   * Context type for PUT requests
   * @template TBody - Request body type
   * @template R - Response type
   * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
   */
  type CtxPut<
    TBody = Record<string, unknown>,
    R = Record<string, unknown>,
    Q = Record<string, unknown>
  > = {
    /** Available when scope is 'issue' - automatically uses ExtendedIssue if extension properties are defined */
    issue?: ExtendedIssue;
    /** Available when scope is 'project' - automatically uses ExtendedProject if extension properties are defined */
    project?: ExtendedProject;
    /** Available when scope is 'article' - automatically uses ExtendedArticle if extension properties are defined */
    article?: ExtendedArticle;
    /** Available when scope is 'user' - automatically uses ExtendedUser if extension properties are defined */
    user?: ExtendedUser;
    /** Current user making the request */
    currentUser: User;
    /** App settings */
    settings: AppSettings;
    /** Global storage extension properties - automatically uses AppGlobalStorageExtensionProperties if defined */
    globalStorage?: {
      extensionProperties?: AppGlobalStorageExtensionProperties;
    };
    request: {
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
    response: HttpResponse<R>;
  };

  /**
   * Context type for GET requests
   * @template R - Response type
   * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
   */
  type CtxGet<
    R = Record<string, unknown>,
    Q = Record<string, unknown>
  > = {
    /** Available when scope is 'issue' - automatically uses ExtendedIssue if extension properties are defined */
    issue?: ExtendedIssue;
    /** Available when scope is 'project' - automatically uses ExtendedProject if extension properties are defined */
    project?: ExtendedProject;
    /** Available when scope is 'article' - automatically uses ExtendedArticle if extension properties are defined */
    article?: ExtendedArticle;
    /** Available when scope is 'user' - automatically uses ExtendedUser if extension properties are defined */
    user?: ExtendedUser;
    /** Current user making the request */
    currentUser: User;
    /** App settings */
    settings: AppSettings;
    /** Global storage extension properties - automatically uses AppGlobalStorageExtensionProperties if defined */
    globalStorage?: {
      extensionProperties?: AppGlobalStorageExtensionProperties;
    };
    request: {
      body: string;
      bodyAsStream: unknown;
      headers: Array<{ name: string; value: string }>;
      path: string;
      fullPath: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      parameterNames: Array<string>;
      json: () => never;
      getParameter: (name: string) => string | undefined;
      getParameters: (name: string) => Array<string>;
      query: Q;
    };
    response: HttpResponse<R>;
  };

  /**
   * Context type for DELETE requests
   * @template R - Response type
   * @template Q - Query parameters type (optional, defaults to Record<string, unknown>)
   */
  type CtxDelete<
    R = Record<string, unknown>,
    Q = Record<string, unknown>
  > = {
    /** Available when scope is 'issue' - automatically uses ExtendedIssue if extension properties are defined */
    issue?: ExtendedIssue;
    /** Available when scope is 'project' - automatically uses ExtendedProject if extension properties are defined */
    project?: ExtendedProject;
    /** Available when scope is 'article' - automatically uses ExtendedArticle if extension properties are defined */
    article?: ExtendedArticle;
    /** Available when scope is 'user' - automatically uses ExtendedUser if extension properties are defined */
    user?: ExtendedUser;
    /** Current user making the request */
    currentUser: User;
    /** App settings */
    settings: AppSettings;
    /** Global storage extension properties - automatically uses AppGlobalStorageExtensionProperties if defined */
    globalStorage?: {
      extensionProperties?: AppGlobalStorageExtensionProperties;
    };
    request: {
      body: string;
      bodyAsStream: unknown;
      headers: Array<{ name: string; value: string }>;
      path: string;
      fullPath: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      parameterNames: Array<string>;
      json: () => never;
      getParameter: (name: string) => string | undefined;
      getParameters: (name: string) => Array<string>;
      query: Q;
    };
    response: HttpResponse<R>;
  };
}

//This is needed to make the file a module
export {};


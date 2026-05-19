/**
 * HTTP module for making HTTP requests from workflows.
 * @module @jetbrains/youtrack-scripting-api/http
 */

/**
 * HTTP response object.
 */
export interface Response {
  /**
   * HTTP status code.
   */
  readonly code: number;

  /**
   * Response headers.
   */
  readonly headers: Array<{name: string, value: string}>;

  /**
   * Response body as text.
   */
  readonly response: string;

  /**
   * Response body as text (alias for response).
   */
  readonly body: string;

  /**
   * A byte stream representation of the response body.
   */
  readonly responseAsStream: any;

  /**
   * A byte stream representation of the response body (alias).
   */
  readonly bodyAsStream: any;

  /**
   * Parse response body as JSON.
   */
  json(): any;

  /**
   * Check if the response is successful (status code 2xx).
   */
  readonly isSuccess: boolean;

  /**
   * Exception that occurred during processing, if any.
   */
  readonly exception?: any;
}

/**
 * Query parameter object.
 */
export interface QueryParam {
  name: string;
  value: string;
}

/**
 * Header object.
 */
export interface Header {
  name: string;
  value: string;
}

/**
 * HTTP Connection class for managing persistent HTTP connections.
 */
export class Connection {
  /**
   * The URL of the target site for the connection.
   */
  readonly url?: string;

  /**
   * A list of headers.
   */
  readonly headers: Array<Header>;

  /**
   * Creates an object that lets you establish a connection with a target site.
   * @param url The URL of the target site for the connection. Can be empty, as you can specify the URI as a parameter for any request method.
   * @param sslKeyName Optional name of the SSL key that is used to establish a secure connection. If you don't want to specify this parameter, pass null.
   * @param timeout Optional parameter that specifies the connection timeout for outgoing HTTP requests in milliseconds.
   */
  constructor(url?: string, sslKeyName?: string | null, timeout?: number);

  /**
   * Adds a new header to the current connection.
   * The value parameter can also contain references to secrets stored in the settings for a YouTrack app.
   * @param header A header object with the structure {name: string, value: string}. If the value parameter is specified separately, the provided string is used as the name of the header.
   * @param value The value that is assigned to the header. Only considered when the first parameter is specified as a string.
   * @returns The current connection object.
   */
  addHeader(header: Header | string, value?: string): Connection;

  /**
   * Sets a header to the current connection. If the specified header already exists, its value is updated.
   * The value parameter can also contain references to secrets stored in the settings for a YouTrack app.
   * @param header A header object with the structure {name: string, value: string}. If the value parameter is specified separately, the provided string is used as the name of the header.
   * @param value The value that is assigned to the header. Only considered when the first parameter is specified as a string.
   * @returns The current connection object.
   */
  setHeader(header: Header | string, value?: string): Connection;

  /**
   * Adds an authorization header with the value returned by the Base64.encode(login + ':' + password) function.
   * The password parameter also accepts references to secrets stored in the settings for a YouTrack app.
   * @param login The login to use for the authorization request.
   * @param password The password to use for the authorization request.
   * @returns The current connection object.
   */
  basicAuth(login: string, password: string): Connection;

  /**
   * Adds an authorization header with the value in "Bearer" format ('Bearer ' + token).
   * The token parameter also accepts references to secrets stored in the settings for a YouTrack app.
   * @param token The token to use for the authorization request.
   * @returns The current connection object.
   */
  bearerAuth(token: string): Connection;

  /**
   * Sends a synchronous HTTP request.
   * @param requestType A valid HTTP request type.
   * @param uri A relative URI. The complete URL is a concatenation of the string that is passed to the URL parameter in the Connection constructor and this string.
   * @param queryParams The query parameters.
   * @param payload The payload to be sent in the request.
   * @returns An object that represents the HTTP response.
   */
  doSync(requestType: string, uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>, payload?: string | any): Response;

  /**
   * Executes a synchronous GET request.
   * @param uri The request URI.
   * @param queryParams The query parameters.
   * @returns An object that represents an HTTP response.
   */
  getSync(uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>): Response;

  /**
   * Executes a synchronous HEAD request.
   * @param uri The request URI.
   * @param queryParams The query parameters.
   * @returns An object that represents an HTTP response.
   */
  headSync(uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>): Response;

  /**
   * Executes a synchronous POST request.
   * @param uri The request URI.
   * @param queryParams The query parameters.
   * @param payload The payload to be sent in the request.
   * @returns An object that represents an HTTP response.
   */
  postSync(uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>, payload?: string | any): Response;

  /**
   * Executes a synchronous PUT request.
   * @param uri The request URI.
   * @param queryParams The query parameters.
   * @param payload The payload to be sent in the request.
   * @returns An object that represents an HTTP response.
   */
  putSync(uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>, payload?: string): Response;

  /**
   * Executes a synchronous PATCH request.
   * @param uri The request URI.
   * @param queryParams The query parameters.
   * @param payload The payload to be sent in the request.
   * @returns An object that represents an HTTP response.
   */
  patchSync(uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>, payload?: string): Response;

  /**
   * Executes a synchronous DELETE request.
   * @param uri The request URI.
   * @param queryParams The query parameters.
   * @returns An object that represents an HTTP response.
   */
  deleteSync(uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>): Response;

  /**
   * Executes a synchronous CONNECT request.
   * @param uri request URI.
   * @param queryParams The query parameters.
   * @returns An object that represents an HTTP response.
   */
  connectSync(uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>): Response;

  /**
   * Executes a synchronous OPTIONS request.
   * @param uri request URI.
   * @param queryParams The query parameters.
   * @returns An object that represents an HTTP response.
   */
  optionsSync(uri?: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>): Response;
}

/**
 * Global `http` object available in workflow scripts.
 *
 * Method signatures use `any` payloads pending verification of the runtime
 * shape; the JetBrains workflow API docs are the authoritative source.
 */
declare global {
  const http: {
    get(uri: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>): Response;
    post(uri: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>, payload?: string | any): Response;
    put(uri: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>, payload?: string | any): Response;
    del(uri: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>): Response;
    request(requestType: string, uri: string, queryParams?: Array<QueryParam> | Record<string, string | string[]>, payload?: string | any): Response;
    Connection: typeof Connection;
  };
}

/*
 Copyright 2017 JetBrains s.r.o.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Type definitions for YouTrack Apps (HTTP handlers, extension properties, settings).
 * @module @jetbrains/youtrack-scripting-api/apps
 */

// Import entity types from the main workflow stubs file
import type { Issue, Project, User, UserGroup, Article } from './workflowTypeScriptStubs.js';

// =============================================================================
// App Type Registry (Module Augmentation Pattern)
// =============================================================================

/**
 * Type registry for app-specific types. Apps should augment this interface
 * to provide typed settings, extension properties, and request/response types.
 *
 * This enables the "ambient typing" pattern where handler functions automatically
 * receive properly typed context without explicit imports.
 *
 * @example
 * ```typescript
 * // In your app's generated types file (e.g., src/app-types.d.ts):
 * declare module '@jetbrains/youtrack-scripting-api/apps' {
 *   interface AppTypeRegistry {
 *     settings: {
 *       apiKey: string;
 *       webhookUrl: string;
 *       maxRetries: number;
 *     };
 *     issueExtensions: {
 *       syncStatus: 'pending' | 'synced' | 'failed' | null;
 *       lastSyncDate: number | null;
 *     };
 *     projectExtensions: {
 *       integrationEnabled: boolean;
 *     };
 *   }
 * }
 * ```
 *
 * After augmentation, all handler contexts will automatically have typed
 * `settings` and `extensionProperties` without any imports in handler files.
 */
export interface AppTypeRegistry {
  /**
   * App settings type. Augment this with your settings.json schema.
   * @default Record<string, unknown>
   */
  settings: Record<string, unknown>;

  /**
   * Issue extension properties type. Augment with your issue extensions.
   * @default {}
   */
  issueExtensions: {};

  /**
   * Project extension properties type. Augment with your project extensions.
   * @default {}
   */
  projectExtensions: {};

  /**
   * Article extension properties type. Augment with your article extensions.
   * @default {}
   */
  articleExtensions: {};

  /**
   * User extension properties type. Augment with your user extensions.
   * @default {}
   */
  userExtensions: {};

  /**
   * AppGlobalStorage extension properties type. Augment with your global storage extensions.
   * @default {}
   */
  appGlobalStorageExtensions: {};
}

// =============================================================================
// HTTP Handler Types
// =============================================================================

/**
 * HTTP methods supported by YouTrack app endpoints.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';

/**
 * Scope of an HTTP endpoint determining available context.
 */
export type HttpScope = 'global' | 'project' | 'issue' | 'article' | 'user';

/**
 * HTTP request object available in endpoint handlers.
 * @template TBody - Type of the parsed request body. Defaults to unknown.
 * @template TQueryParams - Type of query parameters as a record. Defaults to unknown.
 */
export interface HttpRequest<TBody = unknown, TQueryParams = unknown> {
  /**
   * Raw request body as string.
   */
  readonly body: string;

  /**
   * Parse request body as JSON.
   * @returns Parsed JSON object with type TBody
   */
  json(): TBody;

  /**
   * Get a query or form parameter by name.
   * For typed access, use the generic TQueryParams with getParameter.
   * @param name Parameter name
   * @returns Parameter value or undefined
   */
  getParameter<K extends keyof TQueryParams>(name: K): TQueryParams[K] extends string ? string | undefined : string | undefined;
  getParameter(name: string): string | undefined;

  /**
   * Get all values of a parameter (for multi-value parameters).
   * @param name Parameter name
   * @returns Array of parameter values
   */
  getParameters(name: string): string[];

  /**
   * Get a request header by name.
   * @param name Header name
   * @returns Header value or undefined
   */
  getHeader(name: string): string | undefined;

  /**
   * HTTP method of the request.
   */
  readonly method: HttpMethod;

  /**
   * Request path.
   */
  readonly path: string;

  /**
   * Query string portion of the URL.
   */
  readonly queryString: string;

  /**
   * Typed query parameters accessor.
   * Access query params with dot notation when TQueryParams is defined.
   */
  readonly params: TQueryParams extends Record<string, unknown>
    ? { [K in keyof TQueryParams]: string | undefined }
    : Record<string, string | undefined>;
}

/**
 * HTTP response object for building endpoint responses.
 * @template TResponseBody - Type of the response body for json(). Defaults to unknown.
 */
export interface HttpResponse<TResponseBody = unknown> {
  /**
   * Response body as string. Can be set directly.
   */
  body: string;

  /**
   * Content type of the response.
   */
  contentType: string;

  /**
   * HTTP status code.
   */
  statusCode: number;

  /**
   * Send a JSON response.
   * @param data Data to serialize as JSON, typed as TResponseBody
   */
  json(data: TResponseBody): void;

  /**
   * Send a plain text response.
   * @param data Text content
   */
  text(data: string): void;

  /**
   * Add a response header.
   * @param name Header name
   * @param value Header value
   */
  addHeader(name: string, value: string): void;

  /**
   * Set the HTTP status code.
   * @param code HTTP status code
   */
  status(code: number): void;
}

/**
 * Base context available to all HTTP handlers.
 * Uses AppTypeRegistry for default settings type - augment the registry for app-specific types.
 *
 * @template TSettings - Type of app settings. Defaults to AppTypeRegistry['settings'].
 * @template TRequestBody - Type of the request body. Defaults to unknown.
 * @template TResponseBody - Type of the response body. Defaults to unknown.
 * @template TQueryParams - Type of query parameters. Defaults to unknown.
 */
export interface BaseHttpContext<
  TSettings = AppTypeRegistry['settings'],
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> {
  /**
   * The HTTP request object with typed body and query params.
   */
  readonly request: HttpRequest<TRequestBody, TQueryParams>;

  /**
   * The HTTP response object with typed response body.
   */
  readonly response: HttpResponse<TResponseBody>;

  /**
   * The currently authenticated user.
   */
  readonly currentUser: User;

  /**
   * App settings as key-value pairs.
   * Type is inferred from AppTypeRegistry['settings'] or explicit TSettings.
   */
  readonly settings: TSettings;
}

/**
 * Context for project-scoped HTTP handlers.
 * Uses AppTypeRegistry for default types - augment the registry for app-specific types.
 *
 * @template TSettings - Type of app settings. Defaults to AppTypeRegistry['settings'].
 * @template TProjectExtensions - Type of project extension properties. Defaults to AppTypeRegistry['projectExtensions'].
 * @template TRequestBody - Type of the request body. Defaults to unknown.
 * @template TResponseBody - Type of the response body. Defaults to unknown.
 * @template TQueryParams - Type of query parameters. Defaults to unknown.
 */
export interface ProjectHttpContext<
  TSettings = AppTypeRegistry['settings'],
  TProjectExtensions = AppTypeRegistry['projectExtensions'],
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> extends BaseHttpContext<TSettings, TRequestBody, TResponseBody, TQueryParams> {
  /**
   * The project in context with typed extension properties.
   */
  readonly project: Project & { extensionProperties: TProjectExtensions };
}

/**
 * Context for issue-scoped HTTP handlers.
 * Uses AppTypeRegistry for default types - augment the registry for app-specific types.
 *
 * @template TSettings - Type of app settings. Defaults to AppTypeRegistry['settings'].
 * @template TIssueExtensions - Type of issue extension properties. Defaults to AppTypeRegistry['issueExtensions'].
 * @template TProjectExtensions - Type of project extension properties. Defaults to AppTypeRegistry['projectExtensions'].
 * @template TRequestBody - Type of the request body. Defaults to unknown.
 * @template TResponseBody - Type of the response body. Defaults to unknown.
 * @template TQueryParams - Type of query parameters. Defaults to unknown.
 */
export interface IssueHttpContext<
  TSettings = AppTypeRegistry['settings'],
  TIssueExtensions = AppTypeRegistry['issueExtensions'],
  TProjectExtensions = AppTypeRegistry['projectExtensions'],
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> extends ProjectHttpContext<TSettings, TProjectExtensions, TRequestBody, TResponseBody, TQueryParams> {
  /**
   * The issue in context with typed extension properties.
   */
  readonly issue: Issue & { extensionProperties: TIssueExtensions };
}

/**
 * Union type for all HTTP handler contexts.
 * Uses AppTypeRegistry for defaults.
 */
export type HttpHandlerContext<
  TSettings = AppTypeRegistry['settings'],
  TIssueExtensions = AppTypeRegistry['issueExtensions'],
  TProjectExtensions = AppTypeRegistry['projectExtensions'],
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> = BaseHttpContext<TSettings, TRequestBody, TResponseBody, TQueryParams>
  | ProjectHttpContext<TSettings, TProjectExtensions, TRequestBody, TResponseBody, TQueryParams>
  | IssueHttpContext<TSettings, TIssueExtensions, TProjectExtensions, TRequestBody, TResponseBody, TQueryParams>;

/**
 * HTTP endpoint definition.
 * Uses AppTypeRegistry for default types - augment the registry for app-specific types.
 *
 * @template TScope - Scope of the endpoint ('global' | 'project' | 'issue')
 * @template TSettings - Type of app settings. Defaults to AppTypeRegistry['settings'].
 * @template TIssueExtensions - Type of issue extension properties. Defaults to AppTypeRegistry['issueExtensions'].
 * @template TProjectExtensions - Type of project extension properties. Defaults to AppTypeRegistry['projectExtensions'].
 * @template TRequestBody - Type of the request body. Defaults to unknown.
 * @template TResponseBody - Type of the response body. Defaults to unknown.
 * @template TQueryParams - Type of query parameters. Defaults to unknown.
 */
export interface HttpEndpoint<
  TScope extends HttpScope = HttpScope,
  TSettings = AppTypeRegistry['settings'],
  TIssueExtensions = AppTypeRegistry['issueExtensions'],
  TProjectExtensions = AppTypeRegistry['projectExtensions'],
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> {
  /**
   * HTTP method for this endpoint.
   */
  method: HttpMethod;

  /**
   * URL path for the endpoint (relative to app base path).
   */
  path: string;

  /**
   * Scope of the endpoint. Determines available context.
   * - 'global': Only base context (request, response, currentUser, settings)
   * - 'project': Adds project to context
   * - 'issue': Adds project and issue to context
   * @default 'global'
   */
  scope?: TScope;

  /**
   * Handler function for the endpoint.
   * The context is typed based on scope and includes typed request/response.
   */
  handle: (ctx: TScope extends 'issue'
    ? IssueHttpContext<TSettings, TIssueExtensions, TProjectExtensions, TRequestBody, TResponseBody, TQueryParams>
    : TScope extends 'project'
      ? ProjectHttpContext<TSettings, TProjectExtensions, TRequestBody, TResponseBody, TQueryParams>
      : BaseHttpContext<TSettings, TRequestBody, TResponseBody, TQueryParams>
  ) => void | Promise<void>;
}

/**
 * HTTP handler module export.
 * Uses AppTypeRegistry for default types.
 *
 * @template TSettings - Type of app settings. Defaults to AppTypeRegistry['settings'].
 * @template TIssueExtensions - Type of issue extension properties. Defaults to AppTypeRegistry['issueExtensions'].
 * @template TProjectExtensions - Type of project extension properties. Defaults to AppTypeRegistry['projectExtensions'].
 */
export interface HttpHandler<
  TSettings = AppTypeRegistry['settings'],
  TIssueExtensions = AppTypeRegistry['issueExtensions'],
  TProjectExtensions = AppTypeRegistry['projectExtensions']
> {
  /**
   * Array of endpoint definitions.
   */
  endpoints: HttpEndpoint<HttpScope, TSettings, TIssueExtensions, TProjectExtensions>[];
}

// =============================================================================
// File-Based Routing Handler Types
// =============================================================================

/**
 * Handler function for global-scoped endpoints (file-based routing).
 * Used when exporting a default function from files like `global/api/users/GET.ts`.
 *
 * @template TRequestBody - Type of the request body. Defaults to unknown.
 * @template TResponseBody - Type of the response body. Defaults to unknown.
 * @template TQueryParams - Type of query parameters. Defaults to unknown.
 *
 * @example
 * ```typescript
 * // In global/api/status/GET.ts
 * const handler: GlobalHandler = (ctx) => {
 *   ctx.response.json({ status: 'ok', user: ctx.currentUser.login });
 * };
 * export default handler;
 * ```
 */
export type GlobalHandler<
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> = (ctx: BaseHttpContext<AppTypeRegistry['settings'], TRequestBody, TResponseBody, TQueryParams>) => void | Promise<void>;

/**
 * Handler function for project-scoped endpoints (file-based routing).
 * Used when exporting a default function from files like `project/settings/GET.ts`.
 *
 * @template TRequestBody - Type of the request body. Defaults to unknown.
 * @template TResponseBody - Type of the response body. Defaults to unknown.
 * @template TQueryParams - Type of query parameters. Defaults to unknown.
 *
 * @example
 * ```typescript
 * // In project/config/POST.ts
 * interface ConfigRequest { enabled: boolean }
 *
 * const handler: ProjectHandler<ConfigRequest> = (ctx) => {
 *   const { enabled } = ctx.request.json();
 *   ctx.project.extensionProperties.integrationEnabled = enabled;
 *   ctx.response.json({ success: true });
 * };
 * export default handler;
 * ```
 */
export type ProjectHandler<
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> = (ctx: ProjectHttpContext<
  AppTypeRegistry['settings'],
  AppTypeRegistry['projectExtensions'],
  TRequestBody,
  TResponseBody,
  TQueryParams
>) => void | Promise<void>;

/**
 * Handler function for issue-scoped endpoints (file-based routing).
 * Used when exporting a default function from files like `issue/sync/POST.ts`.
 *
 * @template TRequestBody - Type of the request body. Defaults to unknown.
 * @template TResponseBody - Type of the response body. Defaults to unknown.
 * @template TQueryParams - Type of query parameters. Defaults to unknown.
 *
 * @example
 * ```typescript
 * // In issue/sync/POST.ts
 * interface SyncResponse { synced: boolean; timestamp: number }
 *
 * const handler: IssueHandler<unknown, SyncResponse> = (ctx) => {
 *   ctx.issue.extensionProperties.syncStatus = 'synced';
 *   ctx.issue.extensionProperties.lastSyncDate = Date.now();
 *   ctx.response.json({ synced: true, timestamp: Date.now() });
 * };
 * export default handler;
 * ```
 */
export type IssueHandler<
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> = (ctx: IssueHttpContext<
  AppTypeRegistry['settings'],
  AppTypeRegistry['issueExtensions'],
  AppTypeRegistry['projectExtensions'],
  TRequestBody,
  TResponseBody,
  TQueryParams
>) => void | Promise<void>;

// =============================================================================
// Entity Extension Types
// =============================================================================

/**
 * Supported types for extension properties.
 */
export type ExtensionPropertyType =
  | 'string'
  | 'integer'
  | 'float'
  | 'boolean'
  | 'Issue'
  | 'User'
  | 'Project'
  | 'Article'
  | 'UserGroup';

/**
 * Map from extension property type to TypeScript type.
 */
export interface ExtensionPropertyTypeMap {
  string: string | null;
  integer: number | null;
  float: number | null;
  boolean: boolean | null;
  Issue: Issue | null;
  User: User | null;
  Project: Project | null;
  Article: Article | null;
  UserGroup: UserGroup | null;
}

/**
 * Multi-value extension property wrapper.
 */
export interface MultiValueExtensionProperty<T> {
  /**
   * Iterate over all values.
   */
  [Symbol.iterator](): Iterator<T>;

  /**
   * Add a value to the collection.
   */
  add(value: T): void;

  /**
   * Remove a value from the collection.
   */
  remove(value: T): void;

  /**
   * Check if the collection contains a value.
   */
  contains(value: T): boolean;

  /**
   * Number of values in the collection.
   */
  readonly size: number;

  /**
   * Check if the collection is empty.
   */
  readonly isEmpty: boolean;
}

/**
 * Extension property definition in entity-extensions.json.
 */
export interface ExtensionPropertyDefinition {
  /**
   * Type of the property.
   */
  type: ExtensionPropertyType;

  /**
   * Whether the property can hold multiple values.
   * @default false
   */
  multi?: boolean;
}

/**
 * Entity type extension definition.
 */
export interface EntityTypeExtension {
  /**
   * Entity type to extend.
   */
  entityType: 'Issue' | 'User' | 'Project' | 'Article' | 'UserGroup';

  /**
   * Properties to add to the entity.
   */
  properties: Record<string, ExtensionPropertyDefinition>;
}

/**
 * Root structure of entity-extensions.json.
 */
export interface EntityExtensionsConfig {
  entityTypeExtensions: EntityTypeExtension[];
}

// =============================================================================
// App Settings Types
// =============================================================================

/**
 * Settings scope.
 */
export type SettingsScope = 'global' | 'project';

/**
 * Settings JSON Schema with YouTrack extensions.
 */
export interface SettingsSchema {
  $schema?: string;
  title?: string;
  type: 'object';
  properties?: Record<string, SettingsPropertySchema>;
  required?: string[];
}

/**
 * Settings property schema with YouTrack extensions.
 */
export interface SettingsPropertySchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  format?: 'secret' | string;
  items?: SettingsPropertySchema;

  /**
   * YouTrack extension: scope of the setting.
   */
  'x-scope'?: SettingsScope;

  /**
   * YouTrack extension: entity type for object settings.
   */
  'x-entity'?: 'User' | 'UserGroup' | 'Issue' | 'Project' | 'Article';
}

// =============================================================================
// App Manifest Types
// =============================================================================

/**
 * Widget extension points.
 */
export type WidgetExtensionPoint =
  | 'ISSUE_FIELD_PANEL_FIRST'
  | 'ISSUE_FIELD_PANEL_LAST'
  | 'ISSUE_OPTIONS_MENU_ITEM'
  | 'ISSUE_BELOW_SUMMARY'
  | 'ISSUE_ABOVE_ACTIVITY_STREAM'
  | 'ARTICLE_OPTIONS_MENU_ITEM'
  | 'ARTICLE_BELOW_SUMMARY'
  | 'ARTICLE_ABOVE_ACTIVITY_STREAM'
  | 'ADMINISTRATION_MENU_ITEM'
  | 'PROJECT_SETTINGS'
  | 'HELPDESK_CHANNEL'
  | 'USER_PROFILE_SETTINGS'
  | 'USER_CARD'
  | 'MARKDOWN'
  | 'DASHBOARD_WIDGET'
  | 'MAIN_MENU_ITEM';

/**
 * Widget definition in manifest.json.
 */
export interface WidgetDefinition {
  /**
   * Unique key for the widget within the app.
   */
  key: string;

  /**
   * Display name of the widget.
   */
  name: string;

  /**
   * Description of the widget.
   */
  description?: string;

  /**
   * Extension point where the widget appears.
   */
  extensionPoint?: WidgetExtensionPoint;

  /**
   * Alternative to extensionPoint.
   */
  place?: string;

  /**
   * Path to the widget's index.html file.
   */
  indexPath: string;

  /**
   * Path to the widget's icon.
   */
  iconPath?: string;
}

/**
 * Vendor information in manifest.json.
 */
export interface AppVendor {
  name: string;
  url?: string;
  email?: string;
}

/**
 * App manifest.json structure.
 */
export interface AppManifest {
  /**
   * Unique identifier for the app.
   */
  name: string;

  /**
   * Human-readable title.
   */
  title: string;

  /**
   * Description of the app.
   */
  description?: string;

  /**
   * App version.
   */
  version?: string;

  /**
   * URL to app documentation or repository.
   */
  url?: string;

  /**
   * Vendor information.
   */
  vendor?: AppVendor;

  /**
   * Widget definitions.
   */
  widgets?: WidgetDefinition[];

  /**
   * Prefix for AI tools defined by this app.
   */
  aiToolPrefix?: string;
}

// =============================================================================
// Client Factory Types
// =============================================================================

/**
 * Context passed to client factory functions.
 * @template TSettings - Type of app settings. Defaults to Record<string, unknown>.
 */
export interface ClientFactoryContext<TSettings = Record<string, unknown>> {
  /**
   * Current user.
   */
  readonly currentUser: User;

  /**
   * App settings.
   */
  readonly settings: TSettings;
}

/**
 * Client factory function type.
 * @template T - Type of the client returned
 * @template TSettings - Type of app settings
 */
export type ClientFactory<T = unknown, TSettings = Record<string, unknown>> = (context: ClientFactoryContext<TSettings>) => T;

// =============================================================================
// State Machine Types
// =============================================================================

/**
 * State machine transition definition.
 */
export interface StateMachineTransition {
  /**
   * Target state name.
   */
  targetState: string;

  /**
   * Guard function to check if transition is allowed.
   */
  guard?: (ctx: unknown) => boolean;

  /**
   * Action to perform during transition.
   */
  action?: (ctx: unknown) => void;
}

/**
 * State definition in a state machine.
 */
export interface StateMachineState {
  /**
   * Whether this is the initial state.
   */
  initial?: boolean;

  /**
   * Available transitions from this state.
   */
  transitions: Record<string, StateMachineTransition>;
}

/**
 * State machine configuration.
 */
export interface StateMachineConfig {
  /**
   * Title of the state machine rule.
   */
  title: string;

  /**
   * Field name that holds the state.
   */
  fieldName: string;

  /**
   * State definitions.
   */
  states: Record<string, StateMachineState>;

  /**
   * Optional field name for type-specific machines.
   */
  typeFieldName?: string;

  /**
   * Alternative state machines for specific type values.
   */
  alternativeMachines?: Record<string, Record<string, StateMachineState>>;
}

// =============================================================================
// SLA Rule Types
// =============================================================================

/**
 * SLA rule context.
 */
export interface SLARuleContext {
  /**
   * The issue being evaluated.
   */
  readonly issue: Issue;

  /**
   * Current user.
   */
  readonly currentUser: User;
}

/**
 * SLA rule definition.
 */
export interface SLARule {
  /**
   * Target entity type.
   */
  target: 'Issue';

  /**
   * Rule type identifier.
   */
  ruleType: 'sla';

  /**
   * Guard function to check if SLA applies.
   */
  guard: (ctx: SLARuleContext) => boolean;

  /**
   * Action when SLA conditions are entered.
   */
  onEnter: (ctx: SLARuleContext) => void;

  /**
   * Action when SLA conditions are exited.
   */
  onExit?: (ctx: SLARuleContext) => void;

  /**
   * Action when SLA is breached.
   */
  onBreach?: (ctx: SLARuleContext) => void;

  /**
   * Field requirements for the rule.
   */
  requirements?: Record<string, unknown>;
}

// =============================================================================
// Schedule Rule Types
// =============================================================================

/**
 * Schedule rule context.
 */
export interface ScheduleRuleContext {
  /**
   * The issue being processed.
   */
  readonly issue: Issue;
}

/**
 * Schedule rule configuration.
 */
export interface ScheduleRuleConfig {
  /**
   * YouTrack search query to find issues.
   */
  search: string;

  /**
   * Cron expression for scheduling.
   */
  cron: string;

  /**
   * Action to perform on each found issue.
   */
  action: (ctx: ScheduleRuleContext) => void;

  /**
   * Field requirements for the rule.
   */
  requirements?: Record<string, unknown>;
}

// =============================================================================
// Export Patterns
// =============================================================================

/**
 * Possible exports from an app backend script.
 * @template TSettings - Type of app settings
 * @template TIssueExtensions - Type of issue extension properties
 * @template TProjectExtensions - Type of project extension properties
 */
export interface AppExports<
  TSettings = Record<string, unknown>,
  TIssueExtensions = {},
  TProjectExtensions = {}
> {
  /**
   * HTTP handler definition.
   */
  httpHandler?: HttpHandler<TSettings, TIssueExtensions, TProjectExtensions>;

  /**
   * Client factory function.
   */
  Client?: ClientFactory<unknown, TSettings>;

  /**
   * Workflow rule (action, onChange, stateMachine, etc.)
   */
  rule?: unknown;

  /**
   * AI tool definition.
   */
  aiTool?: unknown;

  /**
   * Additional custom exports.
   */
  [key: string]: unknown;
}

// =============================================================================
// Helper Types for App Development
// =============================================================================

/**
 * Helper type to define a typed HTTP handler with app-specific settings and extensions.
 *
 * @example
 * ```typescript
 * // In your app's types file (generated or manual):
 * interface MySettings { apiKey: string; maxRetries: number; }
 * interface MyIssueExtensions { customField: string | null; }
 *
 * // In your handler:
 * export const httpHandler: TypedHttpHandler<MySettings, MyIssueExtensions> = {
 *   endpoints: [{
 *     method: 'GET',
 *     path: '/data',
 *     scope: 'issue',
 *     handle: (ctx) => {
 *       // ctx.settings.apiKey is typed as string
 *       // ctx.issue.extensionProperties.customField is typed
 *       ctx.response.json({ field: ctx.issue.extensionProperties.customField });
 *     }
 *   }]
 * };
 * ```
 */
export type TypedHttpHandler<
  TSettings = Record<string, unknown>,
  TIssueExtensions = {},
  TProjectExtensions = {}
> = HttpHandler<TSettings, TIssueExtensions, TProjectExtensions>;

/**
 * Helper type to define a typed client factory with app-specific settings.
 *
 * @example
 * ```typescript
 * interface MySettings { apiKey: string; }
 * interface MyClient { fetch(url: string): Promise<unknown>; }
 *
 * export const Client: TypedClientFactory<MyClient, MySettings> = (ctx) => {
 *   const { apiKey } = ctx.settings; // typed!
 *   return {
 *     fetch: async (url) => {
 *       // Use apiKey in requests
 *     }
 *   };
 * };
 * ```
 */
export type TypedClientFactory<TClient, TSettings = Record<string, unknown>> = ClientFactory<TClient, TSettings>;

/**
 * Helper type to define a typed HTTP endpoint with specific request, response, and query param types.
 * Use this for individual endpoints where you want to type the request/response bodies.
 *
 * @example
 * ```typescript
 * interface CreateUserRequest { name: string; email: string; }
 * interface CreateUserResponse { id: string; name: string; }
 * interface QueryParams { includeDetails: string; }
 *
 * const endpoint: TypedHttpEndpoint<'global', MySettings, {}, {}, CreateUserRequest, CreateUserResponse, QueryParams> = {
 *   method: 'POST',
 *   path: '/users',
 *   handle: (ctx) => {
 *     const body = ctx.request.json(); // typed as CreateUserRequest
 *     const includeDetails = ctx.request.params.includeDetails; // typed
 *     ctx.response.json({ id: '123', name: body.name }); // typed as CreateUserResponse
 *   }
 * };
 * ```
 */
export type TypedHttpEndpoint<
  TScope extends HttpScope = HttpScope,
  TSettings = Record<string, unknown>,
  TIssueExtensions = {},
  TProjectExtensions = {},
  TRequestBody = unknown,
  TResponseBody = unknown,
  TQueryParams = unknown
> = HttpEndpoint<TScope, TSettings, TIssueExtensions, TProjectExtensions, TRequestBody, TResponseBody, TQueryParams>;

/**
 * Utility type to extract settings type from an HttpHandler.
 */
export type InferSettings<T> = T extends HttpHandler<infer S, any, any> ? S : never;

/**
 * Utility type to extract issue extensions type from an HttpHandler.
 */
export type InferIssueExtensions<T> = T extends HttpHandler<any, infer I, any> ? I : never;

/**
 * Utility type to extract project extensions type from an HttpHandler.
 */
export type InferProjectExtensions<T> = T extends HttpHandler<any, any, infer P> ? P : never;

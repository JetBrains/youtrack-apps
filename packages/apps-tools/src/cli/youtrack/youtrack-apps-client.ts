import {Config} from '../../../@types/types.js';
import {queryfields, QueryField} from '../../../lib/net/queryfields.js';
import {generateRequestParams, prepareErrorMessage} from '../../../lib/net/request.js';
import {resolve} from '../../../lib/net/resolve.js';
import {createPaginationPlan, PaginatedResult, PaginationOptions} from '../pagination.js';
import {
  APP_RESOLVE_FIELDS,
  APP_LIST_FIELDS,
  APP_INFO_FIELDS,
  APP_PACKAGE_FIELDS,
  APP_SETTINGS_UPDATE_FIELDS,
  APP_USAGE_FIELDS,
  APP_USAGE_UPDATE_FIELDS,
  AppConfiguration,
  AppDetails,
  AppSettingsUpdate,
  AppUsage,
  GLOBAL_CONFIG_FIELDS,
  GROUP_MEMBERS_FIELDS,
  GROUP_SEARCH_FIELDS,
  IssueFieldsSchema,
  LogEntry,
  LogsResponse,
  normalizeAppId,
  PROJECT_APP_CONFIG_FIELDS,
  PROJECT_APP_CONFIG_LIST_FIELDS,
  PROJECT_FIELDS_FIELDS,
  PROJECT_RESOLVE_FIELDS,
  PROJECT_SEARCH_FIELDS,
  ProjectCustomField,
  ProjectDetails,
  RULE_LOG_FIELDS,
  RuleLogEntry,
  TAG_SEARCH_FIELDS,
  TagDetails,
  USER_DETAILS_FIELDS,
  USER_SEARCH_FIELDS,
  UserDetails,
  UserGroup,
  UserGroupMembers,
  UserSummary,
  WORKFLOW_LOG_RESOLVE_FIELDS,
} from '../management/types.js';

type JsonMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const PROJECT_FIELDS_TOOL_CALL_FIELDS: QueryField = ['name', {content: ['text']}, 'isError'];

interface JsonRequestOptions {
  fields?: QueryField;
  searchParams?: Record<string, string>;
  body?: unknown;
}

interface ToolCallResponse {
  name?: string;
  content?: {text?: string}[];
  isError?: boolean;
}

export interface ProjectConfigurationPayload {
  id: string;
  app: {id: string};
  project: {id: string};
  enabled: boolean;
}

export interface YouTrackAppsGateway {
  listApps(fields?: QueryField, pagination?: PaginationOptions): Promise<PaginatedResult<AppDetails>>;
  getApp(appName: string, fields?: QueryField): Promise<AppDetails | null>;
  getAppInfo(appName: string): Promise<AppDetails | null>;
  getAppPackage(appName: string): Promise<AppDetails | null>;
  listAppUsages(appId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AppUsage>>;
  listProjects(fields?: QueryField, pagination?: PaginationOptions): Promise<PaginatedResult<ProjectDetails>>;
  getProject(projectShortName: string): Promise<ProjectDetails | null>;
  getProjectFields(projectKey: string): Promise<IssueFieldsSchema>;
  listProjectAppConfigurations(projectId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AppConfiguration>>;
  listProjectCustomFields(projectId: string): Promise<ProjectCustomField[]>;
  searchTags(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<TagDetails>>;
  searchProjectTags(projectId: string, query: string, pagination?: PaginationOptions): Promise<PaginatedResult<TagDetails>>;
  listGroups(query?: string, pagination?: PaginationOptions): Promise<PaginatedResult<UserGroup>>;
  getGroupMembers(groupId: string): Promise<UserGroupMembers | null>;
  listUsers(query?: string, pagination?: PaginationOptions): Promise<PaginatedResult<UserSummary>>;
  getUser(userId: string): Promise<UserDetails | null>;
  deleteWorkflow(appId: string): Promise<void>;
  getGlobalConfig(appId: string): Promise<AppConfiguration | null>;
  updateGlobalConfig(appId: string, payload: AppSettingsUpdate): Promise<AppConfiguration | null>;
  getProjectConfiguration(projectId: string, usageId: string): Promise<AppConfiguration | null>;
  updateProjectConfiguration(projectId: string, usageId: string, payload: ProjectConfigurationPayload | AppSettingsUpdate): Promise<AppConfiguration | null>;
  updateAppUsages(appId: string, projectIds: string[]): Promise<void>;
  getLogs(appId: string, limit?: string): Promise<LogEntry[] | LogsResponse | undefined>;
  getWorkflow(appName: string): Promise<AppDetails | null>;
  searchWorkflows(query: string): Promise<AppDetails[]>;
  getRuleLogs(workflowId: string, ruleId: string, pagination?: PaginationOptions): Promise<PaginatedResult<RuleLogEntry>>;
}

export class YouTrackAppsClient implements YouTrackAppsGateway {
  constructor(private readonly config: Config) {}

  async listApps(fields: QueryField = APP_LIST_FIELDS, pagination?: PaginationOptions): Promise<PaginatedResult<AppDetails>> {
    return await this.listRequest<AppDetails>('/api/admin/apps', fields, {
      sort: 'asc',
    }, pagination);
  }

  async getApp(appName: string, fields: QueryField = APP_RESOLVE_FIELDS): Promise<AppDetails | null> {
    const app = normalizeAppId(appName);
    return await this.jsonRequest<AppDetails>('GET', `/api/admin/apps/${app}`, {fields}) ?? null;
  }

  async getAppInfo(appName: string): Promise<AppDetails | null> {
    const app = normalizeAppId(appName);
    return await this.jsonRequest<AppDetails>('GET', `/api/admin/apps/${app}`, {fields: APP_INFO_FIELDS}) ?? null;
  }

  async getAppPackage(appName: string): Promise<AppDetails | null> {
    const app = normalizeAppId(appName);
    return await this.jsonRequest<AppDetails>('GET', `/api/admin/apps/${app}`, {fields: APP_PACKAGE_FIELDS}) ?? null;
  }

  async listAppUsages(appId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AppUsage>> {
    return await this.listRequest<AppUsage>(`/api/admin/apps/${normalizeAppId(appId)}/usages`, APP_USAGE_FIELDS, {}, pagination);
  }

  async listProjects(fields: QueryField = PROJECT_SEARCH_FIELDS, pagination?: PaginationOptions): Promise<PaginatedResult<ProjectDetails>> {
    return await this.listRequest<ProjectDetails>('/api/admin/projects', fields, {}, pagination);
  }

  async getProject(projectShortName: string): Promise<ProjectDetails | null> {
    return await this.jsonRequest<ProjectDetails>('GET', `/api/admin/projects/${projectShortName}`, {
      fields: PROJECT_RESOLVE_FIELDS,
    }) ?? null;
  }

  async getProjectFields(projectKey: string): Promise<IssueFieldsSchema> {
    const response = await this.jsonRequest<ToolCallResponse>('POST', '/api/ai/tools/call', {
      fields: PROJECT_FIELDS_TOOL_CALL_FIELDS,
      body: {
        name: 'get_issue_fields_schema',
        arguments: {projectKey},
      },
    });

    return parseProjectFieldsToolResponse(response);
  }

  async listProjectAppConfigurations(projectId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AppConfiguration>> {
    return await this.listRequest<AppConfiguration>(
      `/api/admin/projects/${projectId}/appConfigurations`,
      PROJECT_APP_CONFIG_LIST_FIELDS,
      {},
      pagination,
    );
  }

  async listProjectCustomFields(projectId: string): Promise<ProjectCustomField[]> {
    return await this.jsonRequest<ProjectCustomField[]>('GET', `/api/admin/projects/${projectId}/customFields`, {
      fields: PROJECT_FIELDS_FIELDS,
      searchParams: {'$top': '-1'},
    }) ?? [];
  }

  async searchTags(query: string, pagination?: PaginationOptions): Promise<PaginatedResult<TagDetails>> {
    return await this.listRequest<TagDetails>('/api/tags', TAG_SEARCH_FIELDS, {
      query,
      isUsable: 'true',
    }, pagination);
  }

  async searchProjectTags(projectId: string, query: string, pagination?: PaginationOptions): Promise<PaginatedResult<TagDetails>> {
    return await this.listRequest<TagDetails>(`/api/admin/projects/${projectId}/relevantTags`, TAG_SEARCH_FIELDS, {
      query,
    }, pagination);
  }

  async listGroups(query?: string, pagination?: PaginationOptions): Promise<PaginatedResult<UserGroup>> {
    return await this.listRequest<UserGroup>('/api/groups', GROUP_SEARCH_FIELDS, query ? {query} : {}, pagination);
  }

  async getGroupMembers(groupId: string): Promise<UserGroupMembers | null> {
    try {
      return await this.jsonRequest<UserGroupMembers>('GET', `/api/groups/${groupId}`, {
        fields: GROUP_MEMBERS_FIELDS,
      }) ?? null;
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async listUsers(query?: string, pagination?: PaginationOptions): Promise<PaginatedResult<UserSummary>> {
    return await this.listRequest<UserSummary>('/api/users', USER_SEARCH_FIELDS, query ? {query} : {}, pagination);
  }

  async getUser(userId: string): Promise<UserDetails | null> {
    try {
      return await this.jsonRequest<UserDetails>('GET', `/api/users/${userId}`, {
        fields: USER_DETAILS_FIELDS,
      }) ?? null;
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async deleteWorkflow(appId: string): Promise<void> {
    await this.jsonRequest<void>('DELETE', `/api/admin/apps/${appId}`);
  }

  async getGlobalConfig(appId: string): Promise<AppConfiguration | null> {
    return await this.jsonRequest<AppConfiguration>('GET', `/api/admin/apps/${appId}/globalConfig`, {
      fields: GLOBAL_CONFIG_FIELDS,
    }) ?? null;
  }

  async updateGlobalConfig(appId: string, payload: AppSettingsUpdate): Promise<AppConfiguration | null> {
    return await this.jsonRequest<AppConfiguration>('POST', `/api/admin/apps/${appId}/globalConfig`, {
      fields: APP_SETTINGS_UPDATE_FIELDS,
      body: payload,
    }) ?? null;
  }

  async getProjectConfiguration(projectId: string, usageId: string): Promise<AppConfiguration | null> {
    return await this.jsonRequest<AppConfiguration>('GET', `/api/admin/projects/${projectId}/appConfigurations/${usageId}`, {
      fields: PROJECT_APP_CONFIG_FIELDS,
    }) ?? null;
  }

  async updateProjectConfiguration(
    projectId: string,
    usageId: string,
    payload: ProjectConfigurationPayload | AppSettingsUpdate,
  ): Promise<AppConfiguration | null> {
    return await this.jsonRequest<AppConfiguration>('POST', `/api/admin/projects/${projectId}/appConfigurations/${usageId}`, {
      fields: APP_SETTINGS_UPDATE_FIELDS,
      body: payload,
    }) ?? null;
  }

  async updateAppUsages(appId: string, projectIds: string[]): Promise<void> {
    await this.jsonRequest<void>('PUT', `/api/admin/apps/${appId}/usages`, {
      fields: APP_USAGE_UPDATE_FIELDS,
      body: projectIds.map(id => ({project: {id}})),
    });
  }

  async getLogs(appId: string, limit?: string): Promise<LogEntry[] | LogsResponse | undefined> {
    const text = await this.textRequest('GET', `/api/admin/apps/${appId}/logs`, {
      searchParams: limit ? {'$top': limit} : undefined,
    });
    return parseLogsResponse(text);
  }

  async getWorkflow(appName: string): Promise<AppDetails | null> {
    const app = normalizeAppId(appName);
    try {
      return await this.jsonRequest<AppDetails>('GET', `/api/admin/workflows/${app}`, {
        fields: WORKFLOW_LOG_RESOLVE_FIELDS,
      }) ?? null;
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async searchWorkflows(query: string): Promise<AppDetails[]> {
    return await this.jsonRequest<AppDetails[]>('GET', '/api/admin/workflows', {
      fields: WORKFLOW_LOG_RESOLVE_FIELDS,
      searchParams: {query},
    }) ?? [];
  }

  async getRuleLogs(
    workflowId: string,
    ruleId: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<RuleLogEntry>> {
    return await this.listRequest<RuleLogEntry>(
      `/api/admin/workflows/${normalizeAppId(workflowId)}/rules/${ruleId}/logs`,
      RULE_LOG_FIELDS,
      {},
      pagination,
    );
  }

  private async jsonRequest<T>(
    method: JsonMethod,
    path: string,
    options: JsonRequestOptions = {},
  ): Promise<T | undefined> {
    const text = await this.textRequest(method, path, options);
    if (text === undefined) {
      return undefined;
    }

    return JSON.parse(text) as T;
  }

  private async listRequest<T>(
    path: string,
    fields: QueryField,
    searchParams: Record<string, string> = {},
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const plan = createPaginationPlan(pagination);
    const page = await this.jsonRequest<T[]>('GET', path, {
      fields,
      searchParams: {
        ...searchParams,
        '$skip': plan.skip.toString(),
        '$top': plan.limit.toString(),
      },
    }) ?? [];

    const hasMore = page.length >= plan.limit;

    return {
      items: page,
      pagination: {
        skip: plan.skip,
        limit: plan.limit,
        returned: page.length,
        nextSkip: hasMore ? plan.skip + page.length : null,
        hasMore,
      },
    };
  }

  private async textRequest(
    method: JsonMethod,
    path: string,
    options: JsonRequestOptions = {},
  ): Promise<string | undefined> {
    const url = resolve(this.config.host, path);

    if (options.fields) {
      url.searchParams.append('fields', queryfields(options.fields));
    }

    for (const [key, value] of Object.entries(options.searchParams ?? {})) {
      url.searchParams.append(key, value);
    }

    const requestParams = generateRequestParams(this.config, url.href, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const res = await fetch(requestParams);

    if (!res.ok) {
      const error = await prepareErrorMessage(res);
      throw new Error(error);
    }

    if (res.status === 204) {
      return undefined;
    }

    const text = await res.text();
    if (!text.trim()) {
      return undefined;
    }

    return text;
  }
}

function parseLogsResponse(text: string | undefined): LogEntry[] | LogsResponse | undefined {
  if (text === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(text) as LogEntry[] | LogsResponse;
  } catch {
    return text.split(/\r?\n/).map(line => line.trimEnd()).filter(Boolean);
  }
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith('[404]');
}

function parseProjectFieldsToolResponse(response: ToolCallResponse | undefined): IssueFieldsSchema {
  const text = response?.content
    ?.map(item => item.text)
    .filter((item): item is string => typeof item === 'string')
    .join('\n')
    .trim();

  if (response?.isError) {
    throw new Error(text || 'Failed to fetch project fields schema');
  }

  if (!text) {
    return {type: 'object', properties: {}, required: []};
  }

  const data = parseJsonText(text);
  if (isIssueFieldsSchema(data)) {
    return data;
  }

  throw new Error('Project fields schema response is not a JSON schema object');
}

function parseJsonText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fencedJson) {
      return JSON.parse(fencedJson[1]);
    }

    const firstJsonStart = Math.min(...[text.indexOf('{'), text.indexOf('[')].filter(index => index >= 0));
    const lastJsonEnd = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
    if (Number.isFinite(firstJsonStart) && lastJsonEnd > firstJsonStart) {
      return JSON.parse(text.slice(firstJsonStart, lastJsonEnd + 1));
    }

    throw new Error('Project fields schema response is not valid JSON');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isIssueFieldsSchema(value: unknown): value is IssueFieldsSchema {
  return isRecord(value) && isRecord(value.properties);
}

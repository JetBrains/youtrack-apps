import {i18n} from '../../../lib/i18n/i18n.js';
import {Config} from '../../../@types/types.js';
import {QueryField} from '../../../lib/net/queryfields.js';
import {PaginatedResult, PaginationOptions} from '../pagination.js';
import {
  APP_PROBLEM_FIELDS,
  AppConfiguration,
  AppDetails,
  AppProblem,
  AppProject,
  AppSettingsUpdate,
  EnabledResult,
  findUsageForProject,
  GroupMembersResult,
  LogEntry,
  LogsResponse,
  AppRule,
  ProjectDetails,
  ProjectFieldsResult,
  PROJECT_RESOLVE_FIELDS,
  ProjectScopeResult,
  RuleLogEntry,
  SearchResult,
  TagDetails,
  UserGroup,
  UserInfoResult,
  UserSummary,
} from './types.js';
import {YouTrackAppsClient, YouTrackAppsGateway} from '../youtrack/youtrack-apps-client.js';

const RESOURCE_RESOLVE_LIMIT = 100;

export class AppManagementOperations {
  constructor(private readonly client: YouTrackAppsGateway) {}

  async search(query?: string, pagination?: PaginationOptions): Promise<PaginatedResult<SearchResult>> {
    if (!query) {
      throw new Error(i18n('Search query should be defined'));
    }

    return await this.client.searchApps(query, undefined, pagination);
  }

  async getInfo(appName?: string): Promise<AppDetails> {
    return await this.requireApp(appName, APP_PROBLEM_FIELDS);
  }

  async getPackage(appName?: string): Promise<AppDetails> {
    const resolvedApp = await this.requireAppFromSearch(appName);
    const app = await this.client.getAppPackage(resolvedApp.id);
    if (!app) {
      throw new Error(i18n(`App "${appName}" was not found`));
    }

    return app;
  }

  async deleteApp(appName?: string): Promise<AppDetails> {
    const app = await this.requireApp(appName);
    await this.client.deleteWorkflow(app.id);
    return app;
  }

  async setEnabled(appName: string | undefined, enabled: boolean, projectShortName?: string | null): Promise<EnabledResult> {
    const app = await this.requireApp(appName);

    if (!projectShortName) {
      await this.client.updateGlobalConfig(app.id, {enabled});
      return {app, enabled};
    }

    const project = await this.requireProject(projectShortName);
    const usage = findUsageForProject(app, project);

    if (!usage) {
      throw new Error(i18n(`App "${app.name}" is not attached to project "${projectShortName}"`));
    }

    await this.client.updateProjectConfiguration(project.id, usage.id, {
      id: usage.id,
      app: {id: app.id},
      project: {id: project.id},
      enabled,
    });

    return {app, project, enabled};
  }

  async setProjectScope(
    appName: string | undefined,
    projectShortName: string | null,
    action: 'attach' | 'detach',
  ): Promise<ProjectScopeResult> {
    const project = await this.requireProject(projectShortName);
    const app = await this.requireApp(appName);

    const currentProjects = (app.usages ?? []).map(usage => usage.project).filter(isProject);
    const nextProjects = action === 'attach'
      ? addProject(currentProjects, project)
      : currentProjects.filter(candidate => candidate.id !== project.id);

    await this.client.updateAppUsages(app.id, nextProjects.map(candidate => candidate.id));
    return {app, project, projectIds: nextProjects.map(candidate => candidate.id)};
  }

  async getLogs(appName: string | undefined, top: string | null): Promise<LogEntry[]> {
    const normalizedTop = validateTop(top);
    const app = await this.requireApp(appName);
    return normalizeLogs(await this.client.getLogs(app.id, normalizedTop ?? undefined));
  }

  async getScriptLogs(
    appName: string | undefined,
    scriptName: string | undefined,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<RuleLogEntry>> {
    if (!appName) {
      throw new Error(i18n('App name should be defined'));
    }

    if (!scriptName) {
      throw new Error(i18n('Script name should be defined'));
    }

    const app = await this.requireWorkflowPackage(appName);
    const rule = requireExactMatch(
      app.rules ?? [],
      scriptName,
      rule => [rule.id, rule.name, rule.title],
      'Script',
    );

    if (!rule.id) {
      throw new Error(i18n(`Script "${scriptName}" does not have an ID`));
    }

    return await this.client.getRuleLogs(app.id, rule.id, pagination);
  }

  async getRequirementErrors(appName?: string): Promise<AppProblem[]> {
    const app = await this.requireApp(appName, APP_PROBLEM_FIELDS);
    return collectProblems(app);
  }

  async searchTags(
    query: string | undefined,
    projectShortName?: string | null,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<TagDetails>> {
    if (!query) {
      throw new Error(i18n('Tag query should be defined'));
    }

    if (!projectShortName) {
      return await this.client.searchTags(query, pagination);
    }

    const project = await this.requireProject(projectShortName);
    return await this.client.searchProjectTags(project.id, query, pagination);
  }

  async getSettings(appName: string | undefined, projectShortName?: string | null): Promise<AppConfiguration> {
    const app = await this.requireAppFromSearch(appName);

    if (!projectShortName) {
      const config = await this.client.getGlobalConfig(app.id);
      if (!config) {
        throw new Error(i18n(`Global settings for app "${app.name}" were not found`));
      }
      return config;
    }

    const {project, usage} = await this.requireProjectUsage(app, projectShortName);
    const config = await this.client.getProjectConfiguration(project.id, usage.id);
    if (!config) {
      throw new Error(i18n(`Project settings for app "${app.name}" and project "${projectShortName}" were not found`));
    }
    return config;
  }

  async updateSettings(
    appName: string | undefined,
    payload: AppSettingsUpdate,
    projectShortName?: string | null,
  ): Promise<AppConfiguration> {
    if (payload.enabled === undefined && payload.globalSettings === undefined && payload.projectSettings === undefined) {
      throw new Error(i18n('No settings update was provided'));
    }

    const app = await this.requireAppFromSearch(appName);

    if (!projectShortName) {
      const config = await this.client.updateGlobalConfig(app.id, payload);
      if (!config) {
        throw new Error(i18n(`Global settings for app "${app.name}" were not updated`));
      }
      return config;
    }

    const {project, usage} = await this.requireProjectUsage(app, projectShortName);
    const config = await this.client.updateProjectConfiguration(project.id, usage.id, payload);
    if (!config) {
      throw new Error(i18n(`Project settings for app "${app.name}" and project "${projectShortName}" were not updated`));
    }
    return config;
  }

  async listProjects(pagination?: PaginationOptions): Promise<PaginatedResult<ProjectDetails>> {
    return await this.client.listProjects(undefined, pagination);
  }

  async getProjectInfo(projectKey?: string, pagination?: PaginationOptions): Promise<ProjectDetails> {
    const project = await this.requireProjectByKey(projectKey, pagination);
    if (!project.shortName) {
      throw new Error(i18n(`Project "${projectKey}" does not have a short name`));
    }

    const details = await this.client.getProject(project.shortName);
    if (!details) {
      throw new Error(i18n(`Project "${projectKey}" was not found`));
    }

    return details;
  }

  async getProjectFields(projectKey?: string, pagination?: PaginationOptions): Promise<ProjectFieldsResult> {
    const project = await this.requireProjectByKey(projectKey, pagination);
    const fields = await this.client.getProjectFields(project.shortName ?? project.id);
    return {project, fields};
  }

  async listGroups(pagination?: PaginationOptions): Promise<PaginatedResult<UserGroup>> {
    return await this.client.listGroups(pagination);
  }

  async getGroupMembers(groupKey?: string, pagination?: PaginationOptions): Promise<GroupMembersResult> {
    const group = await this.requireGroupByKey(groupKey, pagination);
    const details = await this.client.getGroupMembers(group.id);
    return {group, members: details?.ownUsers ?? []};
  }

  async listUsers(pagination?: PaginationOptions): Promise<PaginatedResult<UserSummary>> {
    return await this.client.listUsers(pagination);
  }

  async getUserInfo(userKey?: string, pagination?: PaginationOptions): Promise<UserInfoResult> {
    const user = await this.requireUserByKey(userKey, pagination);
    const details = await this.client.getUser(user.id);
    if (!details) {
      throw new Error(i18n(`User "${userKey}" was not found`));
    }

    return {...user, ...details};
  }

  private async requireApp(appName?: string, fields?: QueryField): Promise<AppDetails> {
    if (!appName) {
      throw new Error(i18n('App name should be defined'));
    }

    const app = await this.client.getApp(appName, fields);
    if (!app) {
      throw new Error(i18n(`App "${appName}" was not found`));
    }

    return app;
  }

  private async requireAppFromSearch(appQuery?: string): Promise<AppDetails> {
    if (!appQuery) {
      throw new Error(i18n('App name should be defined'));
    }

    const matches = (await this.client.searchApps(appQuery, undefined, {limit: 2})).items;
    const exactMatches = findExactAppMatches(matches, appQuery);
    const candidates = exactMatches.length ? exactMatches : matches;

    if (candidates.length > 1) {
      throw new Error(i18n(`App "${appQuery}" is ambiguous`));
    }

    if (candidates.length === 1) {
      const app = await this.client.getApp(candidates[0].id);
      if (app) {
        return app;
      }
    }

    const app = await this.client.getApp(appQuery);
    if (!app) {
      throw new Error(i18n(`App "${appQuery}" was not found`));
    }

    return app;
  }

  private async requireProject(projectShortName?: string | null): Promise<ProjectDetails> {
    if (!projectShortName) {
      throw new Error(i18n('Option "--project" is required'));
    }

    const project = await this.client.getProject(projectShortName);
    if (!project) {
      throw new Error(i18n(`Project "${projectShortName}" was not found`));
    }

    return project;
  }

  private async requireProjectUsage(app: AppDetails, projectShortName: string): Promise<{project: ProjectDetails; usage: {id: string}}> {
    const project = await this.requireProject(projectShortName);
    const usage = findUsageForProject(app, project);

    if (!usage) {
      throw new Error(i18n(`App "${app.name}" is not attached to project "${projectShortName}"`));
    }

    return {project, usage};
  }

  private async requireProjectByKey(projectKey?: string, pagination?: PaginationOptions): Promise<ProjectDetails> {
    if (!projectKey) {
      throw new Error(i18n('Project key should be defined'));
    }

    return requireExactMatch(
      (await this.client.listProjects(PROJECT_RESOLVE_FIELDS, resourceResolvePagination(pagination))).items,
      projectKey,
      project => [project.id, project.shortName, project.name],
      'Project',
    );
  }

  private async requireGroupByKey(groupKey?: string, pagination?: PaginationOptions): Promise<UserGroup> {
    if (!groupKey) {
      throw new Error(i18n('Group key should be defined'));
    }

    return requireExactMatch(
      (await this.client.listGroups(resourceResolvePagination(pagination))).items,
      groupKey,
      group => [group.id, group.name],
      'Group',
    );
  }

  private async requireUserByKey(userKey?: string, pagination?: PaginationOptions): Promise<UserSummary> {
    if (!userKey) {
      throw new Error(i18n('User key should be defined'));
    }

    return requireExactMatch(
      (await this.client.listUsers(resourceResolvePagination(pagination))).items,
      userKey,
      user => [user.id, user.login, user.name, user.fullName],
      'User',
    );
  }

  private async requireWorkflowPackage(appQuery: string): Promise<AppDetails & {id: string; rules?: AppRule[]}> {
    const exact = await this.client.getWorkflow(appQuery);
    if (exact) {
      return exact;
    }

    const matches = await this.client.searchWorkflows(appQuery);
    const exactMatches = findExactAppMatches(matches, appQuery);
    const candidates = exactMatches.length ? exactMatches : matches;

    if (!candidates.length) {
      throw new Error(i18n(`App "${appQuery}" was not found`));
    }

    if (candidates.length > 1) {
      throw new Error(i18n(`App "${appQuery}" is ambiguous`));
    }

    return candidates[0];
  }

}

export function createAppManagementOperations(config: Config): AppManagementOperations {
  return new AppManagementOperations(new YouTrackAppsClient(config));
}

function validateTop(top: string | null): string | null {
  if (!top) {
    return null;
  }

  const parsed = Number(top);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(i18n('Option "--top" should be a positive number'));
  }

  return top;
}

function resourceResolvePagination(pagination?: PaginationOptions): PaginationOptions {
  return {
    limit: pagination?.limit ?? RESOURCE_RESOLVE_LIMIT,
    skip: pagination?.skip,
  };
}

function normalizeLogs(data: LogEntry[] | LogsResponse | undefined): LogEntry[] {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  return data.logs ?? data.entries ?? [];
}

function collectProblems(app: AppDetails): AppProblem[] {
  return (app.pluggableObjects ?? []).flatMap(object => {
    return (object.usages ?? []).flatMap(usage => {
      return (usage.problems ?? []).map(problem => ({
        ...problem,
        appId: app.id,
        appName: app.name,
        pluggableObjectId: object.id,
        pluggableObjectName: object.name ?? object.title,
        projectId: usage.configuration?.project?.id,
        projectName: usage.configuration?.project?.name,
        projectShortName: usage.configuration?.project?.shortName,
      }));
    });
  });
}

function isProject(project: AppProject | undefined): project is AppProject & {id: string} {
  return typeof project?.id === 'string';
}

function addProject(projects: (AppProject & {id: string})[], project: ProjectDetails): (AppProject & {id: string})[] {
  if (projects.some(candidate => candidate.id === project.id)) {
    return projects;
  }

  return projects.concat(project);
}

function requireExactMatch<T>(
  values: T[],
  query: string,
  selectors: (value: T) => (string | undefined)[],
  label: string,
): T {
  const normalizedQuery = normalizeLookupValue(query);
  const matches = values.filter(value => selectors(value).some(candidate => normalizeLookupValue(candidate) === normalizedQuery));

  if (!matches.length) {
    throw new Error(i18n(`${label} "${query}" was not found`));
  }

  if (matches.length > 1) {
    throw new Error(i18n(`${label} "${query}" is ambiguous`));
  }

  return matches[0];
}

function normalizeLookupValue(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function findExactAppMatches<T extends Pick<AppDetails, 'id' | 'name' | 'title'>>(apps: T[], query: string): T[] {
  const normalizedQuery = normalizeLookupValue(query);
  const packageQueryValues = packageLookupValues(query);
  const slugQuery = slugifyLookupValue(query);
  const idOrNameMatches = apps.filter(app => {
    return [app.id, app.name].some(value => packageLookupValues(value).some(candidate => packageQueryValues.includes(candidate)));
  });

  if (idOrNameMatches.length) {
    return idOrNameMatches;
  }

  return apps.filter(app => {
    const title = normalizeLookupValue(app.title);
    return title === normalizedQuery || slugifyLookupValue(app.title) === slugQuery;
  });
}

function packageLookupValues(value: string | undefined): string[] {
  const normalized = normalizeLookupValue(value);
  if (!normalized) {
    return [];
  }

  const unscoped = normalized.replace(/^@/, '');
  const packageName = unscoped.includes('/') ? unscoped.slice(unscoped.lastIndexOf('/') + 1) : unscoped;
  return Array.from(new Set([normalized, unscoped, packageName]));
}

function slugifyLookupValue(value: string | undefined): string {
  return normalizeLookupValue(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

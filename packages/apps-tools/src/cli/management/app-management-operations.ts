import {Config} from '../../../@types/types.js';
import {QueryField} from '../../../lib/net/queryfields.js';
import {createPaginationPlan, PaginatedResult, PaginationOptions} from '../pagination.js';
import {
  AppCatalogResult,
  APP_PROBLEM_FIELDS,
  AppConfiguration,
  AppDetails,
  AppFileReference,
  AppFileResult,
  AppModuleReference,
  AppProblem,
  AppProject,
  AppSettingsUpdate,
  AppUsageDiagnostics,
  AppUsageProblem,
  CustomFieldValue,
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
  TagDetails,
  UserGroup,
  UserInfoResult,
  UserSummary,
  VisibilityResult,
} from './types.js';
import {YouTrackAppsClient, YouTrackAppsGateway} from '../youtrack/youtrack-apps-client.js';

const RESOURCE_RESOLVE_LIMIT = 100;
const PROJECT_ID_PATTERN = /^\d+-\d+$/;

export class AppManagementOperations {
  constructor(private readonly client: YouTrackAppsGateway) {}

  async list(pagination?: PaginationOptions): Promise<PaginatedResult<AppDetails>> {
    return await this.client.listApps(undefined, pagination);
  }

  async resolveApp(appName?: string, fields?: QueryField): Promise<AppDetails> {
    return await this.requireAppByIdOrPackageName(appName, fields);
  }

  async getInfo(appName?: string): Promise<AppDetails> {
    return await this.resolveApp(appName, APP_PROBLEM_FIELDS);
  }

  async getCatalog(appName?: string): Promise<AppCatalogResult> {
    if (!appName) {
      throw new Error('App name should be defined');
    }

    const app = await this.client.getAppInfo(appName);
    if (!app) {
      throw new Error(`App "${appName}" was not found`);
    }

    return {app, files: buildFileCatalog(app), modules: buildModuleCatalog(app)};
  }

  async getPackage(appName?: string): Promise<AppDetails> {
    const resolvedApp = await this.resolveApp(appName);
    const app = await this.client.getAppPackage(resolvedApp.id);
    if (!app) {
      throw new Error(`App "${appName}" was not found`);
    }

    return app;
  }

  async getFile(appName: string | undefined, fileKey: string | undefined): Promise<AppFileResult> {
    if (!appName) {
      throw new Error('App name should be defined');
    }

    if (!fileKey) {
      throw new Error(`File key is required. Run "youtrack-app app info --app ${appName}" to list file keys.`);
    }

    const app = await this.getPackage(appName);
    const files = buildFileCatalog(app);
    const file = requireFile(files, fileKey);
    return {app, file, content: readFileContent(app, file)};
  }

  async deleteApp(appName?: string): Promise<AppDetails> {
    const app = await this.resolveApp(appName);
    await this.client.deleteWorkflow(app.id);
    return app;
  }

  async setEnabled(appName: string | undefined, enabled: boolean, projectShortName?: string | null): Promise<EnabledResult> {
    const app = await this.resolveApp(appName);

    if (!projectShortName) {
      await this.client.updateGlobalConfig(app.id, {enabled});
      return {app, enabled};
    }

    const project = await this.requireProject(projectShortName);
    const usage = findUsageForProject(app, project);

    if (!usage) {
      throw new Error(`App "${app.name}" is not attached to project "${projectShortName}"`);
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
    const app = await this.resolveApp(appName);

    const currentProjects = (app.usages ?? []).map(usage => usage.project).filter(isProject);
    const nextProjects = action === 'attach'
      ? addProject(currentProjects, project)
      : currentProjects.filter(candidate => candidate.id !== project.id);

    await this.client.updateAppUsages(app.id, nextProjects.map(candidate => candidate.id));
    return {app, project, projectIds: nextProjects.map(candidate => candidate.id)};
  }

  async getLogs(appName: string | undefined, limit: string | null): Promise<LogEntry[]> {
    const normalizedLimit = validateLogLimit(limit);
    const app = await this.resolveApp(appName);
    return normalizeLogs(await this.client.getLogs(app.id, normalizedLimit ?? undefined));
  }

  async getScriptLogs(
    appName: string | undefined,
    scriptName: string | undefined,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<RuleLogEntry>> {
    if (!appName) {
      throw new Error('App name should be defined');
    }

    if (!scriptName) {
      throw new Error('Script name should be defined');
    }

    const app = await this.requireWorkflowPackage(appName);
    const rule = requireExactMatch(
      app.rules ?? [],
      scriptName,
      rule => [rule.id, rule.name, rule.title],
      'Script',
    );

    if (!rule.id) {
      throw new Error(`Script "${scriptName}" does not have an ID`);
    }

    return await this.client.getRuleLogs(app.id, rule.id, pagination);
  }

  async getRequirementErrors(appName?: string): Promise<AppProblem[]> {
    const app = await this.resolveApp(appName, APP_PROBLEM_FIELDS);
    return collectProblems(app);
  }

  async listUsages(appName: string | undefined, pagination?: PaginationOptions): Promise<PaginatedResult<AppUsageDiagnostics>> {
    const app = await this.resolveApp(appName, APP_PROBLEM_FIELDS);
    return pageLocal(collectUsageDiagnostics(app), pagination);
  }

  async listProjectApps(projectKey: string | undefined, pagination?: PaginationOptions): Promise<PaginatedResult<AppConfiguration>> {
    const project = await this.requireProjectByKey(projectKey);
    return await this.client.listProjectAppConfigurations(project.id, pagination);
  }

  async searchFieldValues(
    query: string | undefined,
    projectKey: string | null,
    fieldKey: string | null,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CustomFieldValue>> {
    if (!projectKey) {
      throw new Error('Option "--project" is required');
    }

    if (!fieldKey) {
      throw new Error('Option "--field" is required');
    }

    const project = await this.requireProjectByKey(projectKey);
    const fields = await this.client.listProjectCustomFields(project.id);
    const field = requireExactMatch(
      fields,
      fieldKey,
      candidate => [candidate.id, candidate.field?.id, candidate.field?.name, candidate.field?.localizedName],
      'Field',
    );

    const values = field.bundle?.values;
    if (!values) {
      throw new Error(`Field "${fieldKey}" does not expose searchable bundle values`);
    }

    const matchingValues = query ? values.filter(value => matchesValue(value, query)) : values;
    return pageLocal(matchingValues, pagination);
  }

  async getVisibility(appName: string | undefined, projectShortName?: string | null): Promise<VisibilityResult> {
    const app = await this.resolveApp(appName);

    if (!projectShortName) {
      const config = await this.client.getGlobalConfig(app.id);
      if (!config) {
        throw new Error(`Global settings for app "${app.name}" were not found`);
      }
      return {app, visibilitySettings: config.visibilitySettings};
    }

    const {project, usage} = await this.requireProjectUsage(app, projectShortName);
    const config = await this.client.getProjectConfiguration(project.id, usage.id);
    if (!config) {
      throw new Error(`Project settings for app "${app.name}" and project "${projectShortName}" were not found`);
    }

    return {app, project, visibilitySettings: config.visibilitySettings};
  }

  async searchTags(
    query: string | undefined,
    projectShortName?: string | null,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<TagDetails>> {
    if (!query) {
      throw new Error('Tag query should be defined');
    }

    if (!projectShortName) {
      return await this.client.searchTags(query, pagination);
    }

    const project = await this.requireProject(projectShortName);
    return await this.client.searchProjectTags(project.id, query, pagination);
  }

  async getSettings(appName: string | undefined, projectShortName?: string | null): Promise<AppConfiguration> {
    const app = await this.resolveApp(appName);

    if (!projectShortName) {
      const config = await this.client.getGlobalConfig(app.id);
      if (!config) {
        throw new Error(`Global settings for app "${app.name}" were not found`);
      }
      return config;
    }

    const {project, usage} = await this.requireProjectUsage(app, projectShortName);
    const config = await this.client.getProjectConfiguration(project.id, usage.id);
    if (!config) {
      throw new Error(`Project settings for app "${app.name}" and project "${projectShortName}" were not found`);
    }
    return config;
  }

  async updateSettings(
    appName: string | undefined,
    payload: AppSettingsUpdate,
    projectShortName?: string | null,
  ): Promise<AppConfiguration> {
    if (payload.enabled === undefined && payload.globalSettings === undefined && payload.projectSettings === undefined) {
      throw new Error('No settings update was provided');
    }

    const app = await this.resolveApp(appName);

    if (!projectShortName) {
      const config = await this.client.updateGlobalConfig(app.id, payload);
      if (!config) {
        throw new Error(`Global settings for app "${app.name}" were not updated`);
      }
      return config;
    }

    const {project, usage} = await this.requireProjectUsage(app, projectShortName);
    const config = await this.client.updateProjectConfiguration(project.id, usage.id, payload);
    if (!config) {
      throw new Error(`Project settings for app "${app.name}" and project "${projectShortName}" were not updated`);
    }
    return config;
  }

  async listProjects(pagination?: PaginationOptions): Promise<PaginatedResult<ProjectDetails>> {
    return await this.client.listProjects(undefined, pagination);
  }

  async getProjectInfo(projectKeyOrID?: string, _pagination?: PaginationOptions): Promise<ProjectDetails> {
    if (!projectKeyOrID) {
      throw new Error('Project key or ID should be defined');
    }

    const project = PROJECT_ID_PATTERN.test(projectKeyOrID)
      ? await this.requireProjectByKey(projectKeyOrID)
      : undefined;
    if (project && !project.shortName) {
      throw new Error(`Project "${projectKeyOrID}" does not have a short name`);
    }

    const projectShortName = project?.shortName ?? projectKeyOrID;
    const details = await this.client.getProject(projectShortName);
    if (!details) {
      throw new Error(`Project "${projectKeyOrID}" was not found`);
    }

    return details;
  }

  async getProjectFields(projectKey?: string, _pagination?: PaginationOptions): Promise<ProjectFieldsResult> {
    const project = await this.requireProjectByKey(projectKey);
    const schema = await this.client.getProjectFields(project.shortName ?? project.id);
    return {project, schema};
  }

  async listGroups(query: string | undefined, pagination?: PaginationOptions): Promise<PaginatedResult<UserGroup>> {
    return await this.client.listGroups(query, pagination);
  }

  async listGroupMembers(pagination?: PaginationOptions): Promise<PaginatedResult<GroupMembersResult>> {
    const groups = await this.client.listGroups(undefined, pagination);
    const items = await Promise.all(groups.items.map(async group => {
      const details = await this.client.getGroupMembers(group.id);
      return {group, members: details?.ownUsers ?? []};
    }));

    return {...groups, items};
  }

  async getGroupMembers(groupKey?: string, pagination?: PaginationOptions): Promise<GroupMembersResult> {
    if (!groupKey) {
      throw new Error('Group key should be defined');
    }

    const direct = await this.client.getGroupMembers(groupKey);
    if (direct?.id) {
      return {
        group: {
          id: direct.id,
          name: direct.name ?? direct.id,
          userCount: direct.userCount,
        },
        members: direct.ownUsers ?? [],
      };
    }

    const group = await this.requireGroupByKey(groupKey, pagination);
    const details = await this.client.getGroupMembers(group.id);
    return {group, members: details?.ownUsers ?? []};
  }

  async listUsers(query: string | undefined, pagination?: PaginationOptions): Promise<PaginatedResult<UserSummary>> {
    return await this.client.listUsers(query, pagination);
  }

  async getUserInfo(userKey?: string, pagination?: PaginationOptions): Promise<UserInfoResult> {
    if (!userKey) {
      throw new Error('User key should be defined');
    }

    const direct = await this.client.getUser(userKey);
    if (direct?.id) {
      return direct as UserInfoResult;
    }

    const user = await this.requireUserByKey(userKey, pagination);
    const details = await this.client.getUser(user.id);
    if (!details) {
      throw new Error(`User "${userKey}" was not found`);
    }

    return {...user, ...details};
  }

  private async requireAppByIdOrPackageName(appName?: string, fields?: QueryField): Promise<AppDetails> {
    if (!appName) {
      throw new Error('App name should be defined');
    }

    const app = await this.client.getApp(appName, fields);
    if (!app) {
      throw new Error(`App "${appName}" was not found`);
    }

    return app;
  }

  private async requireProject(projectShortName?: string | null): Promise<ProjectDetails> {
    if (!projectShortName) {
      throw new Error('Option "--project" is required');
    }

    const project = await this.client.getProject(projectShortName);
    if (!project) {
      throw new Error(`Project "${projectShortName}" was not found`);
    }

    return project;
  }

  private async requireProjectUsage(app: AppDetails, projectShortName: string): Promise<{project: ProjectDetails; usage: {id: string}}> {
    const project = await this.requireProject(projectShortName);
    const usage = findUsageForProject(app, project);

    if (!usage) {
      throw new Error(`App "${app.name}" is not attached to project "${projectShortName}"`);
    }

    return {project, usage};
  }

  private async requireProjectByKey(projectKey?: string): Promise<ProjectDetails> {
    if (!projectKey) {
      throw new Error('Project key should be defined');
    }

    const normalizedProjectKey = normalizeLookupValue(projectKey);
    let pagination = resourceResolvePagination();

    while (true) {
      const page = await this.client.listProjects(PROJECT_RESOLVE_FIELDS, pagination);
      const matches = page.items.filter(project => {
        return [project.id, project.shortName].some(candidate => normalizeLookupValue(candidate) === normalizedProjectKey);
      });

      if (matches.length) {
        return requireExactMatch(
          matches,
          projectKey,
          project => [project.id, project.shortName],
          'Project',
        );
      }

      if (!page.pagination.hasMore || page.pagination.nextSkip === null) {
        break;
      }

      pagination = {
        ...pagination,
        skip: page.pagination.nextSkip,
      };
    }

    return requireExactMatch<ProjectDetails>(
      [],
      projectKey,
      project => [project.id, project.shortName],
      'Project',
    );
  }

  private async requireGroupByKey(groupKey?: string, pagination?: PaginationOptions): Promise<UserGroup> {
    if (!groupKey) {
      throw new Error('Group key should be defined');
    }

    return requireExactMatch(
      (await this.client.listGroups(groupKey, resourceResolvePagination(pagination))).items,
      groupKey,
      group => [group.id, group.name],
      'Group',
    );
  }

  private async requireUserByKey(userKey?: string, pagination?: PaginationOptions): Promise<UserSummary> {
    if (!userKey) {
      throw new Error('User key should be defined');
    }

    return requireExactMatch(
      (await this.client.listUsers(userKey, resourceResolvePagination(pagination))).items,
      userKey,
      user => [user.id, user.login, user.name, user.fullName],
      'User',
    );
  }

  private async requireWorkflowPackage(appQuery: string): Promise<AppDetails & {id: string; rules?: AppRule[]}> {
    const app = await this.client.getWorkflow(appQuery);
    if (!app) {
      throw new Error(`App "${appQuery}" was not found`);
    }

    return app;
  }

}

export function createAppManagementOperations(config: Config): AppManagementOperations {
  return new AppManagementOperations(new YouTrackAppsClient(config));
}

function validateLogLimit(limit: string | null): string | null {
  if (!limit) {
    return null;
  }

  const parsed = Number(limit);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('Option "--limit" should be a positive number');
  }

  return limit;
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

function buildFileCatalog(app: AppDetails): AppFileReference[] {
  const files: AppFileReference[] = [];

  if (app.manifestFile !== null && app.manifestFile !== undefined) {
    files.push({key: 'manifest', label: 'manifest.json', type: 'manifest', id: app.manifestFile.id});
  }

  if (app.settingsFile !== null && app.settingsFile !== undefined) {
    files.push({key: 'settings', label: 'settings.json', type: 'settings', id: app.settingsFile.id});
  }

  if (app.entityExtensionsFile !== null && app.entityExtensionsFile !== undefined) {
    files.push({
      key: 'entityExtensions',
      label: 'entity-extensions.json',
      type: 'entityExtensions',
      id: app.entityExtensionsFile.id,
    });
  }

  const scriptObjects = (app.pluggableObjects ?? []).filter(object => object.script);
  for (const object of scriptObjects) {
    const id = object.script?.id ?? object.id;
    const name = object.script?.name ?? object.name;
    const displayName = object.title ?? name ?? 'script';
    if (id) {
      files.push({
        key: id,
        label: `${displayName}, id: ${id}`,
        type: 'script',
        id,
        name,
        aliases: [id],
      });
    }
  }

  return files;
}

function buildModuleCatalog(app: AppDetails): AppModuleReference[] {
  return [
    ...(app.widgets ?? []).map(widget => ({
      id: widget.id,
      name: widget.name ?? widget.id ?? 'widget',
      description: widget.extensionPoint?.id,
      file: widget.indexPath,
      type: widget.$type,
    })),
    ...(app.adminWidgets ?? []).map(widget => ({
      id: widget.id,
      name: widget.name ?? widget.key ?? widget.id ?? 'admin widget',
      description: widget.description,
      file: widget.indexPath,
      type: widget.$type,
    })),
    ...(app.pluggableObjects ?? []).map(object => {
      const scriptId = object.script?.id ?? object.id;
      const fileName = object.name ?? object.script?.name;
      return {
        id: object.id,
        name: object.title ?? object.name ?? object.id ?? 'module',
        description: object.description,
        file: fileName,
        type: object.typeAlias ?? object.$type,
        scriptId,
      };
    }),
  ];
}

function requireFile(files: AppFileReference[], fileKey: string): AppFileReference {
  const file = files.find(candidate => candidate.key === fileKey || (candidate.aliases ?? []).includes(fileKey));
  if (file) {
    return file;
  }

  const validKeys = files.map(candidate => candidate.key).join(', ') || 'none';
  throw new Error(`File key "${fileKey}" was not found. Valid file keys: ${validKeys}`);
}

function readFileContent(app: AppDetails, file: AppFileReference): string {
  if (file.type === 'manifest') {
    return app.manifestFile?.content ?? '';
  }

  if (file.type === 'settings') {
    return app.settingsFile?.content ?? '';
  }

  if (file.type === 'entityExtensions') {
    return app.entityExtensionsFile?.content ?? '';
  }

  const object = (app.pluggableObjects ?? []).find(candidate => {
    const script = candidate.script;
    return script && (script.id === file.id || script.name === file.name || candidate.id === file.id);
  });

  return object?.script?.script ?? '';
}

function matchesValue(value: CustomFieldValue, query: string): boolean {
  const normalizedQuery = normalizeLookupValue(query);
  return [
    value.id,
    value.name,
    value.localizedName,
    value.login,
    value.fullName,
    value.presentation,
  ].some(candidate => normalizeLookupValue(candidate).includes(normalizedQuery));
}

function pageLocal<T>(items: T[], pagination: PaginationOptions = {}): PaginatedResult<T> {
  const plan = createPaginationPlan(pagination);
  const page = items.slice(plan.skip, plan.skip + plan.limit);
  const nextSkip = plan.skip + page.length;

  return {
    items: page,
    pagination: {
      skip: plan.skip,
      limit: plan.limit,
      returned: page.length,
      nextSkip: nextSkip < items.length ? nextSkip : null,
      hasMore: nextSkip < items.length,
    },
  };
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

function collectUsageDiagnostics(app: AppDetails): AppUsageDiagnostics[] {
  return (app.usages ?? []).map(usage => ({
    ...usage,
    problems: collectProblemsForProject(app, usage.project),
  }));
}

function collectProblemsForProject(app: AppDetails, project: AppProject | undefined): AppUsageProblem[] {
  return (app.pluggableObjects ?? []).flatMap(object => {
    return (object.usages ?? []).flatMap(usage => {
      if (!sameProject(project, usage.configuration?.project)) {
        return [];
      }

      return (usage.problems ?? []).map(problem => ({
        ...problem,
        pluggableObjectId: object.id,
        pluggableObjectName: object.name,
        pluggableObjectTitle: object.title,
        pluggableObjectUsageId: usage.id,
      }));
    });
  });
}

function sameProject(left: AppProject | undefined, right: AppProject | undefined): boolean {
  if (!left || !right) {
    return false;
  }

  return Boolean(
    left.id && right.id && left.id === right.id
    || left.shortName && right.shortName && normalizeLookupValue(left.shortName) === normalizeLookupValue(right.shortName),
  );
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
    throw new Error(`${label} "${query}" was not found`);
  }

  if (matches.length > 1) {
    throw new Error(`${label} "${query}" is ambiguous`);
  }

  return matches[0];
}

function normalizeLookupValue(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

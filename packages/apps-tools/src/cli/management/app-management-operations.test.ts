import {describe, expect, it} from '@jest/globals';
import {
  AppDetails,
  AppConfiguration,
  LogEntry,
  LogsResponse,
  AppSettingsUpdate,
  ProjectCustomField,
  ProjectDetails,
  RuleLogEntry,
  TagDetails,
  UserDetails,
  UserGroup,
  UserGroupMembers,
  UserSummary,
} from './types.js';
import {AppManagementOperations} from './app-management-operations.js';
import {ProjectConfigurationPayload, YouTrackAppsGateway} from '../youtrack/youtrack-apps-client.js';
import {PaginatedResult, PaginationOptions} from '../pagination.js';

describe('AppManagementOperations', () => {
  it('search delegates to the app search endpoint', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      apps: [
        {id: '148-1', name: 'some-app', title: 'Workflow App'},
      ],
    }));

    const result = await operations.search('workflow');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('148-1');
  });

  it('setEnabled builds a project configuration update payload', async () => {
    const gateway = fakeGateway();
    const operations = new AppManagementOperations(gateway);

    const result = await operations.setEnabled('some-app', false, 'CP');

    expect(result.project?.id).toBe('0-1');
    expect(gateway.projectConfigurationUpdates).toEqual([
      {
        projectId: '0-1',
        usageId: '184-1',
        payload: {
          id: '184-1',
          app: {id: '148-1'},
          project: {id: '0-1'},
          enabled: false,
        },
      },
    ]);
  });

  it('getSettings reads global settings when no project is provided', async () => {
    const gateway = fakeGateway({
      apps: [{id: '148-1', name: 'some-app', title: 'Workflow App'}],
      globalConfig: {id: '94-1', enabled: true, globalSettings: '{"apiUrl":"https://api.example.test"}'},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getSettings('Workflow App', null);

    expect(result.id).toBe('94-1');
    expect(gateway.searchRequests).toEqual(['Workflow App']);
    expect(gateway.appRequests).toEqual(['148-1']);
    expect(gateway.globalConfigRequests).toEqual(['148-1']);
  });

  it('updateSettings writes project settings when project is provided', async () => {
    const gateway = fakeGateway();
    const operations = new AppManagementOperations(gateway);

    await operations.updateSettings('some-app', {projectSettings: '{"projectKey":"CP"}'}, 'CP');

    expect(gateway.projectConfigurationUpdates).toEqual([
      {
        projectId: '0-1',
        usageId: '184-1',
        payload: {projectSettings: '{"projectKey":"CP"}'},
      },
    ]);
  });

  it('searchTags uses project relevant tags when project is provided', async () => {
    const gateway = fakeGateway({
      tags: [{id: '6-4', name: 'release'}],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.searchTags('release', 'CP');

    expect(result.items).toEqual([{id: '6-4', name: 'release'}]);
    expect(gateway.projectRequests).toEqual(['CP']);
    expect(gateway.projectTagRequests).toEqual([{projectId: '0-1', query: 'release'}]);
  });

  it('setProjectScope updates app usages from resolved project ids', async () => {
    const gateway = fakeGateway({app: appDetails({usages: []})});
    const operations = new AppManagementOperations(gateway);

    const result = await operations.setProjectScope('some-app', 'CP', 'attach');

    expect(result.projectIds).toEqual(['0-1']);
    expect(gateway.appUsageUpdates).toEqual([{appId: '148-1', projectIds: ['0-1']}]);
  });

  it('getLogs normalizes an empty response to an empty list', async () => {
    const operations = new AppManagementOperations(fakeGateway({logs: undefined}));

    await expect(operations.getLogs('some-app', null)).resolves.toEqual([]);
  });

  it('getScriptLogs resolves app and script before fetching logs', async () => {
    const gateway = fakeGateway({
      workflowPackages: [
        {
          id: 'workflow-1',
          name: 'my-app',
          title: 'My App',
          rules: [
            {id: 'rule-1', name: 'action', title: 'Action', type: 'action'},
          ],
        },
      ],
      ruleLogs: [{id: 'log-1', message: 'warning'}],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getScriptLogs('my-app', 'action', {skip: 0, limit: 100});

    expect(result.items).toEqual([{id: 'log-1', message: 'warning'}]);
    expect(gateway.workflowGetRequests).toEqual(['my-app']);
    expect(gateway.workflowSearchRequests).toEqual([]);
    expect(gateway.ruleLogRequests).toEqual([
      {workflowId: 'workflow-1', ruleId: 'rule-1', options: {skip: 0, limit: 100}},
    ]);
  });

  it('getScriptLogs falls back to search when exact workflow lookup misses', async () => {
    const gateway = fakeGateway({
      workflow: null,
      workflowPackages: [
        {
          id: 'workflow-1',
          name: '@acme/effort-level-monitor',
          title: 'Effort Level Monitor',
          rules: [{id: 'rule-1', name: 'action'}],
        },
        {
          id: 'workflow-2',
          name: 'effort-level-monitor-dev',
          title: 'Effort Level Monitor Dev',
          rules: [{id: 'rule-2', name: 'action'}],
        },
      ],
      ruleLogs: [{id: 'log-1', message: 'warning'}],
    });
    const operations = new AppManagementOperations(gateway);

    await operations.getScriptLogs('effort-level-monitor', 'action');

    expect(gateway.workflowGetRequests).toEqual(['effort-level-monitor']);
    expect(gateway.workflowSearchRequests).toEqual(['effort-level-monitor']);
    expect(gateway.ruleLogRequests).toEqual([
      {workflowId: 'workflow-1', ruleId: 'rule-1', options: undefined},
    ]);
  });

  it('getScriptLogs keeps duplicate unscoped package names ambiguous', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      workflow: null,
      workflowPackages: [
        {id: 'workflow-1', name: '@acme/effort-level-monitor', rules: [{id: 'rule-1', name: 'action'}]},
        {id: 'workflow-2', name: '@other/effort-level-monitor', rules: [{id: 'rule-2', name: 'action'}]},
      ],
    }));

    await expect(operations.getScriptLogs('effort-level-monitor', 'action')).rejects.toThrow('App "effort-level-monitor" is ambiguous');
  });

  it('getProjectInfo resolves exact project names and fetches details by short name', async () => {
    const gateway = fakeGateway({projects: [projectDetails()]});
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getProjectInfo('car-project');

    expect(result.id).toBe('0-1');
    expect(gateway.projectRequests).toEqual(['CP']);
  });

  it('getProjectFields resolves any project key and fetches fields by project short name', async () => {
    const gateway = fakeGateway({
      projects: [projectDetails()],
      projectFields: [{id: 'field-1', field: {id: 'field', name: 'Priority'}, canBeEmpty: false}],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getProjectFields('0-1');

    expect(result.fields).toHaveLength(1);
    expect(gateway.projectFieldsRequests).toEqual(['CP']);
  });

  it('getGroupMembers resolves exact group names and fetches members by group id', async () => {
    const gateway = fakeGateway({
      groups: [{id: 'group-1', name: 'Developers', userCount: 2}],
      groupMembers: {ownUsers: [{id: 'user-1'}, {id: 'user-2'}]},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getGroupMembers('developers');

    expect(result.members).toEqual([{id: 'user-1'}, {id: 'user-2'}]);
    expect(gateway.groupMembersRequests).toEqual(['group-1']);
  });

  it('getUserInfo resolves exact logins and fetches details by user id', async () => {
    const gateway = fakeGateway({
      users: [{id: 'user-1', login: 'root', name: 'root'}],
      userDetails: {email: 'root@example.com', guest: false, userType: {id: 'standard'}},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getUserInfo('ROOT');

    expect(result.email).toBe('root@example.com');
    expect(gateway.userRequests).toEqual(['user-1']);
  });

  it('exact resource matching does not fall back to partial matches', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      users: [{id: 'user-1', login: 'root'}],
    }));

    await expect(operations.getUserInfo('roo')).rejects.toThrow('User "roo" was not found');
  });

  it('exact resource matching rejects ambiguous matches', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      projects: [
        {id: '0-1', name: 'Car Project', shortName: 'CP'},
        {id: '0-2', name: 'CP', shortName: 'OTHER'},
      ],
    }));

    await expect(operations.getProjectInfo('cp')).rejects.toThrow('Project "cp" is ambiguous');
  });

  it('exact resource matching uses a 100 item resolver page by default', async () => {
    const gateway = fakeGateway({projects: [projectDetails()]});
    const operations = new AppManagementOperations(gateway);

    await operations.getProjectInfo('CP');

    expect(gateway.projectListRequests).toEqual([{limit: 100, skip: undefined}]);
  });

  it('exact resource matching forwards explicit pagination options', async () => {
    const gateway = fakeGateway({
      projects: [projectDetails()],
      groups: [{id: 'group-1', name: 'Developers', userCount: 2}],
      users: [{id: 'user-1', login: 'root', name: 'root'}],
    });
    const operations = new AppManagementOperations(gateway);
    const pagination = {skip: 100, limit: 25};

    await operations.getProjectInfo('CP', pagination);
    await operations.getGroupMembers('Developers', pagination);
    await operations.getUserInfo('root', pagination);

    expect(gateway.projectListRequests).toContainEqual(pagination);
    expect(gateway.groupListRequests).toContainEqual(pagination);
    expect(gateway.userListRequests).toContainEqual(pagination);
  });
});

interface FakeGateway extends YouTrackAppsGateway {
  appUsageUpdates: {appId: string; projectIds: string[]}[];
  projectConfigurationUpdates: {projectId: string; usageId: string; payload: ProjectConfigurationPayload | AppSettingsUpdate}[];
  globalConfigRequests: string[];
  globalConfigUpdates: {appId: string; payload: AppSettingsUpdate}[];
  searchRequests: string[];
  appRequests: string[];
  appPackageRequests: string[];
  groupMembersRequests: string[];
  projectFieldsRequests: string[];
  projectRequests: string[];
  tagRequests: string[];
  projectTagRequests: {projectId: string; query: string}[];
  ruleLogRequests: {workflowId: string; ruleId: string; options?: PaginationOptions}[];
  workflowGetRequests: string[];
  workflowSearchRequests: string[];
  userRequests: string[];
  projectListRequests: PaginationOptions[];
  groupListRequests: PaginationOptions[];
  userListRequests: PaginationOptions[];
}

function fakeGateway(overrides: {
  app?: AppDetails;
  apps?: AppDetails[];
  project?: ProjectDetails;
  projects?: ProjectDetails[];
  projectFields?: ProjectCustomField[];
  groups?: UserGroup[];
  groupMembers?: UserGroupMembers;
  users?: UserSummary[];
  userDetails?: UserDetails;
  logs?: LogEntry[] | LogsResponse;
  ruleLogs?: RuleLogEntry[];
  workflow?: AppDetails | null;
  workflowPackages?: AppDetails[];
  tags?: TagDetails[];
  globalConfig?: AppConfiguration;
  projectConfig?: AppConfiguration;
} = {}): FakeGateway {
  const app = overrides.app ?? appDetails();
  const project = overrides.project ?? projectDetails();
  const gateway: FakeGateway = {
    appUsageUpdates: [],
    projectConfigurationUpdates: [],
    globalConfigRequests: [],
    globalConfigUpdates: [],
    searchRequests: [],
    appRequests: [],
    appPackageRequests: [],
    groupMembersRequests: [],
    projectFieldsRequests: [],
    projectRequests: [],
    tagRequests: [],
    projectTagRequests: [],
    ruleLogRequests: [],
    workflowGetRequests: [],
    workflowSearchRequests: [],
    userRequests: [],
    projectListRequests: [],
    groupListRequests: [],
    userListRequests: [],
    async listApps(): Promise<PaginatedResult<AppDetails>> {
      return page(overrides.apps ?? [app]);
    },
    async searchApps(query: string): Promise<PaginatedResult<AppDetails>> {
      gateway.searchRequests.push(query);
      return page(overrides.apps ?? [app]);
    },
    async getApp(appName: string): Promise<AppDetails | null> {
      gateway.appRequests.push(appName);
      return findApp(overrides.apps ?? [app], appName) ?? app;
    },
    async getAppPackage(appName: string): Promise<AppDetails | null> {
      gateway.appPackageRequests.push(appName);
      return findApp(overrides.apps ?? [app], appName) ?? app;
    },
    async listProjects(_fields?: unknown, pagination: PaginationOptions = {}): Promise<PaginatedResult<ProjectDetails>> {
      gateway.projectListRequests.push(pagination);
      return page(overrides.projects ?? [project]);
    },
    async getProject(projectShortName: string): Promise<ProjectDetails | null> {
      gateway.projectRequests.push(projectShortName);
      return project;
    },
    async getProjectFields(projectId: string): Promise<ProjectCustomField[]> {
      gateway.projectFieldsRequests.push(projectId);
      return overrides.projectFields ?? [];
    },
    async searchTags(query: string): Promise<PaginatedResult<TagDetails>> {
      gateway.tagRequests.push(query);
      return page(overrides.tags ?? []);
    },
    async searchProjectTags(projectId: string, query: string): Promise<PaginatedResult<TagDetails>> {
      gateway.projectTagRequests.push({projectId, query});
      return page(overrides.tags ?? []);
    },
    async listGroups(pagination: PaginationOptions = {}): Promise<PaginatedResult<UserGroup>> {
      gateway.groupListRequests.push(pagination);
      return page(overrides.groups ?? []);
    },
    async getGroupMembers(groupId: string): Promise<UserGroupMembers | null> {
      gateway.groupMembersRequests.push(groupId);
      return overrides.groupMembers ?? {ownUsers: []};
    },
    async listUsers(pagination: PaginationOptions = {}): Promise<PaginatedResult<UserSummary>> {
      gateway.userListRequests.push(pagination);
      return page(overrides.users ?? []);
    },
    async getUser(userId: string): Promise<UserDetails | null> {
      gateway.userRequests.push(userId);
      return overrides.userDetails ?? {email: 'user@example.com', guest: false};
    },
    async deleteWorkflow(): Promise<void> {},
    async getGlobalConfig(appId: string): Promise<AppConfiguration | null> {
      gateway.globalConfigRequests.push(appId);
      return overrides.globalConfig ?? {id: '94-1', enabled: true};
    },
    async updateGlobalConfig(appId: string, payload: AppSettingsUpdate): Promise<AppConfiguration | null> {
      gateway.globalConfigUpdates.push({appId, payload});
      return overrides.globalConfig ?? {id: '94-1', ...payload};
    },
    async getProjectConfiguration(): Promise<AppConfiguration | null> {
      return overrides.projectConfig ?? {id: '184-1', enabled: true};
    },
    async updateProjectConfiguration(
      projectId: string,
      usageId: string,
      payload: ProjectConfigurationPayload | AppSettingsUpdate,
    ): Promise<AppConfiguration | null> {
      gateway.projectConfigurationUpdates.push({projectId, usageId, payload});
      return overrides.projectConfig ?? {id: usageId};
    },
    async updateAppUsages(appId: string, projectIds: string[]): Promise<void> {
      gateway.appUsageUpdates.push({appId, projectIds});
    },
    async getLogs(): Promise<LogEntry[] | LogsResponse | undefined> {
      return overrides.logs;
    },
    async getWorkflow(appName: string): Promise<AppDetails | null> {
      gateway.workflowGetRequests.push(appName);
      return overrides.workflow === undefined ? overrides.workflowPackages?.[0] ?? app : overrides.workflow;
    },
    async searchWorkflows(query: string): Promise<AppDetails[]> {
      gateway.workflowSearchRequests.push(query);
      return overrides.workflowPackages ?? [app];
    },
    async getRuleLogs(
      workflowId: string,
      ruleId: string,
      options?: PaginationOptions,
    ): Promise<PaginatedResult<RuleLogEntry>> {
      gateway.ruleLogRequests.push({workflowId, ruleId, options});
      return page(overrides.ruleLogs ?? []);
    },
  };

  return gateway;
}

function findApp(apps: AppDetails[], appName: string): AppDetails | undefined {
  return apps.find(candidate => candidate.id === appName || candidate.name === appName);
}

function page<T>(items: T[]): PaginatedResult<T> {
  return {
    items,
    pagination: {
      skip: 0,
      limit: 50,
      returned: items.length,
      nextSkip: null,
      hasMore: false,
    },
  };
}

function appDetails(overrides: Partial<AppDetails> = {}): AppDetails {
  return {
    id: '148-1',
    name: 'some-app',
    usages: [
      {
        id: '184-1',
        project: projectDetails(),
      },
    ],
    ...overrides,
  };
}

function projectDetails(): ProjectDetails {
  return {
    id: '0-1',
    name: 'Car-Project',
    shortName: 'CP',
  };
}

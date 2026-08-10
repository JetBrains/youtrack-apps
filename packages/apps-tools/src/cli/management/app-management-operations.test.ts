import {describe, expect, it} from '@jest/globals';
import {
  AppDetails,
  AppConfiguration,
  AppUsage,
  CustomFieldValue,
  LogEntry,
  LogsResponse,
  AppSettingsUpdate,
  IssueFieldsSchema,
  ProjectDetails,
  ProjectCustomField,
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
  it('list lists apps through the app list endpoint', async () => {
    const gateway = fakeGateway({
      apps: [
        {id: '148-1', name: 'some-app', title: 'Workflow App'},
      ],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.list();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('148-1');
    expect(gateway.listRequests).toEqual([{}]);
    expect(gateway.appRequests).toEqual([]);
  });

  it('getCatalog returns bounded app details with file keys', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      app: appDetails({
        manifestFile: {id: 'manifest-1'},
        settingsFile: null,
        entityExtensionsFile: null,
        widgets: [{$type: 'Widget', id: '167-1', name: 'Issue widget', indexPath: 'widget/index.html'}],
        pluggableObjects: [
          {$type: 'HttpHandlerPluggableObject', id: '150-1', name: 'backend', script: {id: '150-1', name: 'backend'}},
        ],
      }),
    }));

    const result = await operations.getCatalog('some-app');

    expect(result.files.map(file => file.key)).toEqual(['manifest', '150-1']);
    expect(result.files.find(file => file.type === 'script')?.label).toBe('backend, id: 150-1');
    expect(result.modules).toEqual([
      {
        id: '167-1',
        name: 'Issue widget',
        description: undefined,
        file: 'widget/index.html',
        type: 'Widget',
      },
      {
        id: '150-1',
        name: 'backend',
        description: undefined,
        file: 'backend',
        type: 'HttpHandlerPluggableObject',
        scriptId: '150-1',
      },
    ]);
  });

  it('getFile requires a file key', async () => {
    const operations = new AppManagementOperations(fakeGateway());

    await expect(operations.getFile('some-app', undefined)).rejects.toThrow('File key is required');
  });

  it('getFile returns one script body by file key', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      app: appDetails({
        pluggableObjects: [
          {id: '150-1', name: 'backend', script: {id: '150-1', name: 'backend', script: 'exports.httpHandler = {};'}},
        ],
      }),
    }));

    const result = await operations.getFile('some-app', '150-1');

    expect(result.content).toBe('exports.httpHandler = {};');
  });

  it('deleteApp resolves unique app identifiers before deleting', async () => {
    const gateway = fakeGateway({
      apps: [{id: '148-1', name: 'some-app', title: 'Workflow App'}],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.deleteApp('some-app');

    expect(result.id).toBe('148-1');
    expect(gateway.appRequests).toEqual(['some-app']);
    expect(gateway.deleteRequests).toEqual(['148-1']);
  });

  it('deleteApp does not resolve app titles before deleting', async () => {
    const gateway = fakeGateway({
      apps: [{id: '148-1', name: 'some-app', title: 'Workflow App'}],
    });
    const operations = new AppManagementOperations(gateway);

    await expect(operations.deleteApp('Workflow App')).rejects.toThrow('App "Workflow App" was not found');
    expect(gateway.deleteRequests).toEqual([]);
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

    const result = await operations.getSettings('some-app', null);

    expect(result.id).toBe('94-1');
    expect(gateway.appRequests).toEqual(['some-app']);
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

  it('listUsages resolves app usages with nested requirement problems', async () => {
    const gateway = fakeGateway({
      app: appDetails({
        usages: [{id: '184-2', project: {id: '0-2', shortName: 'JT'}}],
        pluggableObjects: [
          {
            id: '150-1',
            name: 'backend',
            usages: [
              {
                id: '185-1',
                configuration: {project: {id: '0-2', shortName: 'JT'}},
                problems: [{id: 'problem-1', message: 'Missing field', problemKey: 'field-missing'}],
              },
            ],
          },
        ],
      }),
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.listUsages('some-app', {skip: 0, limit: 25});

    expect(result.items).toEqual([
      {
        id: '184-2',
        project: {id: '0-2', shortName: 'JT'},
        problems: [
          {
            id: 'problem-1',
            message: 'Missing field',
            problemKey: 'field-missing',
            pluggableObjectId: '150-1',
            pluggableObjectName: 'backend',
            pluggableObjectTitle: undefined,
            pluggableObjectUsageId: '185-1',
          },
        ],
      },
    ]);
    expect(gateway.appRequests).toEqual(['some-app']);
    expect(gateway.appUsageRequests).toEqual([]);
  });

  it('listProjectApps resolves the project and reads app configurations', async () => {
    const gateway = fakeGateway({
      projectApps: [{id: '184-1', app: {id: '148-1', name: 'some-app'}, enabled: true}],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.listProjectApps('CP', {skip: 0, limit: 25});

    expect(result.items).toEqual([{id: '184-1', app: {id: '148-1', name: 'some-app'}, enabled: true}]);
    expect(gateway.projectAppRequests).toEqual([{projectId: '0-1', pagination: {skip: 0, limit: 25}}]);
  });

  it('searchFieldValues filters project field bundle values', async () => {
    const gateway = fakeGateway({
      projectCustomFields: [
        {
          id: 'pcf-1',
          field: {id: 'field-1', name: 'Priority'},
          bundle: {
            id: 'bundle-1',
            values: [
              {id: 'value-1', name: 'High'},
              {id: 'value-2', name: 'Low'},
            ],
          },
        },
      ],
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.searchFieldValues('hi', 'CP', 'Priority');

    expect(result.items).toEqual([{id: 'value-1', name: 'High'}]);
    expect(gateway.projectCustomFieldRequests).toEqual(['0-1']);
  });

  it('getVisibility reads global app visibility settings', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      globalConfig: {
        id: '94-1',
        visibilitySettings: {permittedGroups: [{id: 'group-1', name: 'Developers'}]},
      },
    }));

    const result = await operations.getVisibility('some-app');

    expect(result.visibilitySettings?.permittedGroups).toEqual([{id: 'group-1', name: 'Developers'}]);
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

  it('getScriptLogs does not search by title when exact workflow lookup misses', async () => {
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

    await expect(operations.getScriptLogs('effort-level-monitor', 'action')).rejects.toThrow('App "effort-level-monitor" was not found');

    expect(gateway.workflowGetRequests).toEqual(['effort-level-monitor']);
    expect(gateway.workflowSearchRequests).toEqual([]);
    expect(gateway.ruleLogRequests).toEqual([]);
  });

  it('getProjectInfo resolves project IDs and short names and fetches details by short name', async () => {
    const gateway = fakeGateway({projects: [projectDetails()]});
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getProjectInfo('CP');

    expect(result.id).toBe('0-1');
    expect(gateway.projectRequests).toEqual(['CP']);
  });

  it('getProjectInfo does not resolve project display names', async () => {
    const operations = new AppManagementOperations(fakeGateway({projects: [projectDetails()]}));

    await expect(operations.getProjectInfo('car-project')).rejects.toThrow('Project "car-project" was not found');
  });

  it('getProjectFields resolves any project key and fetches fields by project short name', async () => {
    const schema = {type: 'object', properties: {Priority: {type: 'string'}}, required: ['Priority']};
    const gateway = fakeGateway({
      projects: [projectDetails()],
      projectFields: schema,
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getProjectFields('0-1');

    expect(result.schema).toEqual(schema);
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
    expect(gateway.groupListRequests).toContainEqual({
      query: 'developers',
      pagination: {limit: 100, skip: undefined},
    });
    expect(gateway.groupMembersRequests).toEqual(['developers', 'group-1']);
  });

  it('listGroups allows an empty query and lists groups', async () => {
    const result = await new AppManagementOperations(fakeGateway({
      groups: [{id: 'group-1', name: 'Developers'}],
    })).listGroups(undefined);

    expect(result.items).toEqual([{id: 'group-1', name: 'Developers'}]);
  });

  it('getGroupMembers accepts a direct group id', async () => {
    const gateway = fakeGateway({
      groupMembers: {id: 'group-1', name: 'Developers', ownUsers: [{id: 'user-1'}]},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getGroupMembers('group-1');

    expect(result).toEqual({
      group: {id: 'group-1', name: 'Developers', userCount: undefined},
      members: [{id: 'user-1'}],
    });
    expect(gateway.groupListRequests).toEqual([]);
    expect(gateway.groupMembersRequests).toEqual(['group-1']);
  });

  it('listGroupMembers lists direct members for each paged group', async () => {
    const gateway = fakeGateway({
      groups: [{id: 'group-1', name: 'Developers'}],
      groupMembers: {id: 'group-1', name: 'Developers', ownUsers: [{id: 'user-1'}]},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.listGroupMembers({skip: 0, limit: 50});

    expect(result.items).toEqual([
      {group: {id: 'group-1', name: 'Developers'}, members: [{id: 'user-1'}]},
    ]);
    expect(gateway.groupListRequests).toContainEqual({query: undefined, pagination: {skip: 0, limit: 50}});
  });

  it('getUserInfo resolves exact logins and fetches details by user id', async () => {
    const gateway = fakeGateway({
      users: [{id: 'user-1', login: 'root', name: 'root'}],
      userDetails: {email: 'root@example.com', guest: false, userType: {id: 'standard'}},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getUserInfo('ROOT');

    expect(result.email).toBe('root@example.com');
    expect(gateway.userListRequests).toContainEqual({
      query: 'ROOT',
      pagination: {limit: 100, skip: undefined},
    });
    expect(gateway.userRequests).toEqual(['ROOT', 'user-1']);
  });

  it('listUsers allows an empty query and lists users', async () => {
    const result = await new AppManagementOperations(fakeGateway({
      users: [{id: 'user-1', login: 'root', name: 'root'}],
    })).listUsers(undefined);

    expect(result.items).toEqual([{id: 'user-1', login: 'root', name: 'root'}]);
  });

  it('getUserInfo accepts a direct user id', async () => {
    const gateway = fakeGateway({
      userDetails: {id: 'user-1', login: 'root', email: 'root@example.com', guest: false},
    });
    const operations = new AppManagementOperations(gateway);

    const result = await operations.getUserInfo('user-1');

    expect(result).toEqual({id: 'user-1', login: 'root', email: 'root@example.com', guest: false});
    expect(gateway.userListRequests).toEqual([]);
    expect(gateway.userRequests).toEqual(['user-1']);
  });

  it('exact resource matching does not fall back to partial matches', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      users: [{id: 'user-1', login: 'root'}],
    }));

    await expect(operations.getUserInfo('roo')).rejects.toThrow('User "roo" was not found');
  });

  it('project matching ignores display-name collisions', async () => {
    const operations = new AppManagementOperations(fakeGateway({
      projects: [
        {id: '0-1', name: 'Car Project', shortName: 'CP'},
        {id: '0-2', name: 'CP', shortName: 'OTHER'},
      ],
    }));

    await expect(operations.getProjectInfo('cp')).resolves.toEqual(
      expect.objectContaining({id: '0-1', shortName: 'CP'}),
    );
  });

  it('exact resource matching uses a 100 item resolver page by default', async () => {
    const gateway = fakeGateway({projects: [projectDetails()]});
    const operations = new AppManagementOperations(gateway);

    await operations.getProjectInfo('CP');

    expect(gateway.projectListRequests).toEqual([{limit: 100, skip: undefined}]);
  });

  it('project resolution continues to later pages', async () => {
    const target = {id: '0-101', name: 'Target Project', shortName: 'TARGET'};
    const gateway = fakeGateway({project: target});
    gateway.listProjects = async (_fields, pagination = {}) => {
      gateway.projectListRequests.push(pagination);

      if (pagination.skip === 100) {
        return {
          items: [target],
          pagination: {skip: 100, limit: 100, returned: 1, nextSkip: null, hasMore: false},
        };
      }

      return {
        items: Array.from({length: 100}, (_value, index) => ({
          id: `0-${index + 1}`,
          name: `Project ${index + 1}`,
          shortName: `P${index + 1}`,
        })),
        pagination: {skip: 0, limit: 100, returned: 100, nextSkip: 100, hasMore: true},
      };
    };
    const operations = new AppManagementOperations(gateway);

    await expect(operations.getProjectInfo('TARGET')).resolves.toEqual(target);
    expect(gateway.projectListRequests).toEqual([
      {limit: 100, skip: undefined},
      {limit: 100, skip: 100},
    ]);
  });

  it('project resolution ignores output pagination options', async () => {
    const gateway = fakeGateway({
      projects: [projectDetails()],
      groups: [{id: 'group-1', name: 'Developers', userCount: 2}],
      users: [{id: 'user-1', login: 'root', name: 'root'}],
    });
    const operations = new AppManagementOperations(gateway);
    const pagination = {skip: 100, limit: 25};

    await operations.getProjectInfo('CP', pagination);
    await operations.getProjectFields('CP', pagination);
    await operations.getGroupMembers('Developers', pagination);
    await operations.getUserInfo('root', pagination);

    expect(gateway.projectListRequests).toEqual([
      {limit: 100, skip: undefined},
      {limit: 100, skip: undefined},
    ]);
    expect(gateway.groupListRequests).toContainEqual({query: 'Developers', pagination});
    expect(gateway.userListRequests).toContainEqual({query: 'root', pagination});
  });
});

interface FakeGateway extends YouTrackAppsGateway {
  appUsageUpdates: {appId: string; projectIds: string[]}[];
  projectConfigurationUpdates: {projectId: string; usageId: string; payload: ProjectConfigurationPayload | AppSettingsUpdate}[];
  globalConfigRequests: string[];
  globalConfigUpdates: {appId: string; payload: AppSettingsUpdate}[];
  listRequests: PaginationOptions[];
  appRequests: string[];
  appInfoRequests: string[];
  appPackageRequests: string[];
  appUsageRequests: {appId: string; pagination: PaginationOptions}[];
  deleteRequests: string[];
  groupMembersRequests: string[];
  projectFieldsRequests: string[];
  projectRequests: string[];
  projectAppRequests: {projectId: string; pagination: PaginationOptions}[];
  projectCustomFieldRequests: string[];
  tagRequests: string[];
  projectTagRequests: {projectId: string; query: string}[];
  ruleLogRequests: {workflowId: string; ruleId: string; options?: PaginationOptions}[];
  workflowGetRequests: string[];
  workflowSearchRequests: string[];
  userRequests: string[];
  projectListRequests: PaginationOptions[];
  groupListRequests: {query: string; pagination: PaginationOptions}[];
  userListRequests: {query: string; pagination: PaginationOptions}[];
}

function fakeGateway(overrides: {
  app?: AppDetails;
  apps?: AppDetails[];
  usages?: AppUsage[];
  project?: ProjectDetails;
  projects?: ProjectDetails[];
  projectApps?: AppConfiguration[];
  projectCustomFields?: ProjectCustomField[];
  fieldValues?: CustomFieldValue[];
  projectFields?: IssueFieldsSchema;
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
    listRequests: [],
    appRequests: [],
    appInfoRequests: [],
    appPackageRequests: [],
    appUsageRequests: [],
    deleteRequests: [],
    groupMembersRequests: [],
    projectFieldsRequests: [],
    projectRequests: [],
    projectAppRequests: [],
    projectCustomFieldRequests: [],
    tagRequests: [],
    projectTagRequests: [],
    ruleLogRequests: [],
    workflowGetRequests: [],
    workflowSearchRequests: [],
    userRequests: [],
    projectListRequests: [],
    groupListRequests: [],
    userListRequests: [],
    async listApps(_fields?: unknown, pagination: PaginationOptions = {}): Promise<PaginatedResult<AppDetails>> {
      gateway.listRequests.push(pagination);
      return page(overrides.apps ?? [app]);
    },
    async getApp(appName: string): Promise<AppDetails | null> {
      gateway.appRequests.push(appName);
      return findApp(overrides.apps ?? [app], appName) ?? null;
    },
    async getAppInfo(appName: string): Promise<AppDetails | null> {
      gateway.appInfoRequests.push(appName);
      return findApp(overrides.apps ?? [app], appName) ?? null;
    },
    async getAppPackage(appName: string): Promise<AppDetails | null> {
      gateway.appPackageRequests.push(appName);
      return findApp(overrides.apps ?? [app], appName) ?? null;
    },
    async listAppUsages(appId: string, pagination: PaginationOptions = {}): Promise<PaginatedResult<AppUsage>> {
      gateway.appUsageRequests.push({appId, pagination});
      return page(overrides.usages ?? app.usages ?? []);
    },
    async listProjects(_fields?: unknown, pagination: PaginationOptions = {}): Promise<PaginatedResult<ProjectDetails>> {
      gateway.projectListRequests.push(pagination);
      return page(overrides.projects ?? [project]);
    },
    async getProject(projectShortName: string): Promise<ProjectDetails | null> {
      gateway.projectRequests.push(projectShortName);
      return project;
    },
    async getProjectFields(projectId: string): Promise<IssueFieldsSchema> {
      gateway.projectFieldsRequests.push(projectId);
      return overrides.projectFields ?? {type: 'object', properties: {}, required: []};
    },
    async listProjectAppConfigurations(projectId: string, pagination: PaginationOptions = {}): Promise<PaginatedResult<AppConfiguration>> {
      gateway.projectAppRequests.push({projectId, pagination});
      return page(overrides.projectApps ?? []);
    },
    async listProjectCustomFields(projectId: string): Promise<ProjectCustomField[]> {
      gateway.projectCustomFieldRequests.push(projectId);
      return overrides.projectCustomFields ?? [];
    },
    async searchTags(query: string): Promise<PaginatedResult<TagDetails>> {
      gateway.tagRequests.push(query);
      return page(overrides.tags ?? []);
    },
    async searchProjectTags(projectId: string, query: string): Promise<PaginatedResult<TagDetails>> {
      gateway.projectTagRequests.push({projectId, query});
      return page(overrides.tags ?? []);
    },
    async listGroups(query: string, pagination: PaginationOptions = {}): Promise<PaginatedResult<UserGroup>> {
      gateway.groupListRequests.push({query, pagination});
      return page(overrides.groups ?? []);
    },
    async getGroupMembers(groupId: string): Promise<UserGroupMembers | null> {
      gateway.groupMembersRequests.push(groupId);
      return overrides.groupMembers ?? {ownUsers: []};
    },
    async listUsers(query: string, pagination: PaginationOptions = {}): Promise<PaginatedResult<UserSummary>> {
      gateway.userListRequests.push({query, pagination});
      return page(overrides.users ?? []);
    },
    async getUser(userId: string): Promise<UserDetails | null> {
      gateway.userRequests.push(userId);
      return overrides.userDetails ?? {email: 'user@example.com', guest: false};
    },
    async deleteWorkflow(appId: string): Promise<void> {
      gateway.deleteRequests.push(appId);
    },
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
      return overrides.workflow === undefined ? findApp(overrides.workflowPackages ?? [app], appName) ?? null : overrides.workflow;
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

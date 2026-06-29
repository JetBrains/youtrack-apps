import {QueryField} from '../../../lib/net/queryfields.js';
import {stringify as stringifyYaml} from 'yaml';

export interface AppRule {
  id?: string;
  name?: string;
  title?: string;
  type?: string;
}

export interface AppTag {
  name?: string;
}

export interface UserReference {
  id?: string;
  login?: string;
  name?: string;
}

export interface GroupReference {
  id?: string;
  name?: string;
}

export interface TagSharingSettings {
  permissionBasedTagAccess?: boolean;
  permittedGroups?: GroupReference[];
  permittedUsers?: UserReference[];
}

export interface TagDetails {
  id: string;
  name: string;
  owner?: UserReference;
  isUsable?: boolean;
  tagSharingSettings?: TagSharingSettings;
}

export interface AppProject {
  id?: string;
  name?: string;
  shortName?: string;
}

export interface AppUsage {
  id: string;
  enabled?: boolean;
  isBroken?: boolean;
  isActive?: boolean;
  missingRequiredSettings?: boolean;
  project?: AppProject;
}

export interface RuleProblem {
  id?: string;
  message?: string;
  fixes?: string[];
  problemKey?: string;
  global?: boolean;
}

export interface PluggableObjectUsage {
  id?: string;
  enabled?: boolean;
  isBroken?: boolean;
  problems?: RuleProblem[];
  configuration?: {
    project?: AppProject;
  };
}

export interface PluggableObject {
  id?: string;
  name?: string;
  title?: string;
  typeAlias?: string;
  isGlobal?: boolean;
  script?: AppScript;
  usages?: PluggableObjectUsage[];
}

export interface AppScript {
  id?: string;
  name?: string;
  script?: string;
  updated?: number;
  updatedBy?: {
    login?: string;
  };
}

export interface AppFileContent {
  content?: string;
}

export interface RequirementError {
  message?: string;
  field?: string;
  details?: unknown;
}

export interface AppDetails {
  id: string;
  name: string;
  title?: string;
  version?: string;
  description?: string;
  tags?: AppTag[];
  canBeAttached?: boolean;
  hasWidgetOrHttp?: boolean;
  fromMarketplace?: boolean;
  manifestFile?: AppFileContent | null;
  settingsFile?: AppFileContent | null;
  entityExtensionsFile?: AppFileContent | null;
  enabled?: boolean;
  globalConfig?: {
    id?: string;
    enabled?: boolean;
    missingRequiredSettings?: boolean;
    globalSettings?: string;
  };
  attachedProjects?: AppProject[];
  requirements?: {
    errors?: RequirementError[];
  };
  rules?: AppRule[];
  usages?: AppUsage[];
  pluggableObjects?: PluggableObject[];
}

export interface ProjectDetails {
  id: string;
  name?: string;
  shortName?: string;
}

export interface VisibilitySettings {
  permittedUsers?: {id?: string; login?: string}[];
  permittedGroups?: {id?: string; name?: string}[];
}

export interface AppConfiguration {
  id: string;
  app?: Pick<AppDetails, 'id' | 'name' | 'title'>;
  project?: ProjectDetails;
  enabled?: boolean;
  isActive?: boolean;
  missingRequiredSettings?: boolean;
  globalSettings?: string;
  projectSettings?: string;
  visibilitySettings?: VisibilitySettings;
}

export interface AppSettingsUpdate {
  enabled?: boolean;
  globalSettings?: string;
  projectSettings?: string;
}

export interface ProjectFieldType {
  isBundleType?: boolean;
  isMultiValue?: boolean;
  valueType?: string;
}

export interface ProjectCustomField {
  id: string;
  field?: {
    id?: string;
    name?: string;
    fieldType?: ProjectFieldType;
  };
  canBeEmpty?: boolean;
}

export interface UserGroup {
  id: string;
  name: string;
  userCount?: number;
}

export interface UserGroupMember {
  id: string;
}

export interface UserGroupMembers {
  ownUsers?: UserGroupMember[];
}

export interface UserSummary {
  banned?: boolean;
  login?: string;
  id: string;
  name?: string;
  fullName?: string;
}

export interface UserDetails {
  userType?: {
    id?: string;
  };
  email?: string;
  guest?: boolean;
}

export interface ProjectFieldsResult {
  project: ProjectDetails;
  fields: ProjectCustomField[];
}

export interface GroupMembersResult {
  group: UserGroup;
  members: UserGroupMember[];
}

export interface UserInfoResult extends UserSummary, UserDetails {}

export type LogEntry = string | Record<string, unknown>;

export interface LogsResponse {
  logs?: LogEntry[];
  entries?: LogEntry[];
}

export interface RuleLogEntry {
  id?: string;
  level?: string;
  timestamp?: string;
  username?: string;
  message?: string;
  stacktrace?: string;
}

export interface AppProblem extends RuleProblem {
  appId: string;
  appName: string;
  pluggableObjectId?: string;
  pluggableObjectName?: string;
  projectId?: string;
  projectName?: string;
  projectShortName?: string;
}

export interface SearchResult extends AppDetails {
  matchedRules?: AppRule[];
}

export interface ProjectScopeResult {
  app: AppDetails;
  project: ProjectDetails;
  projectIds: string[];
}

export interface EnabledResult {
  app: AppDetails;
  enabled: boolean;
  project?: ProjectDetails;
}

export const APP_SEARCH_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  'version',
  'description',
  {tags: ['name']},
  'canBeAttached',
  'hasWidgetOrHttp',
  'fromMarketplace',
  {globalConfig: ['id', 'enabled', 'missingRequiredSettings']},
];

export const APP_RESOLVE_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  {globalConfig: ['enabled']},
  {usages: ['id', 'enabled', 'isBroken', 'isActive', 'missingRequiredSettings', {project: ['id', 'name', 'shortName']}]},
];

export const APP_PACKAGE_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  'version',
  {manifestFile: ['content']},
  {settingsFile: ['content']},
  {entityExtensionsFile: ['content']},
  {
    pluggableObjects: [
      'id',
      'name',
      'title',
      'typeAlias',
      'isGlobal',
      {script: ['id', 'name', 'script', 'updated', {updatedBy: ['login']}]},
    ],
  },
];

export const GLOBAL_CONFIG_FIELDS: QueryField = [
  'id',
  {app: ['id', 'name', 'title']},
  'enabled',
  'missingRequiredSettings',
  'globalSettings',
  {visibilitySettings: [{permittedUsers: ['id', 'login']}, {permittedGroups: ['id', 'name']}]},
];

export const PROJECT_APP_CONFIG_FIELDS: QueryField = [
  'id',
  {app: ['id', 'name', 'title']},
  {project: ['id', 'shortName', 'name']},
  'enabled',
  'isActive',
  'missingRequiredSettings',
  'globalSettings',
  'projectSettings',
  {visibilitySettings: [{permittedUsers: ['id', 'login']}, {permittedGroups: ['id', 'name']}]},
];

export const APP_SETTINGS_UPDATE_FIELDS: QueryField = [
  'id',
  'enabled',
  'isActive',
  'missingRequiredSettings',
  'globalSettings',
  'projectSettings',
];

export const APP_PROBLEM_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  'hasBrokenUsages',
  {usages: ['id', 'enabled', 'isBroken', 'isActive', 'missingRequiredSettings', {project: ['id', 'name', 'shortName']}]},
  {
    pluggableObjects: [
      '$type',
      'id',
      'name',
      'title',
      'isGlobal',
      {
        usages: [
          'id',
          'enabled',
          'isBroken',
          {problems: ['id', 'message', 'fixes', 'problemKey', 'global']},
          {configuration: [{project: ['id', 'name', 'shortName']}]},
          {pluggableObject: ['id']},
        ],
      },
    ],
  },
];

export const PROJECT_RESOLVE_FIELDS: QueryField = ['id', 'name', 'shortName'];

export const PROJECT_SEARCH_FIELDS: QueryField = ['id', 'shortName'];

export const PROJECT_FIELDS_FIELDS: QueryField = [
  'id',
  {field: ['name', 'id', {fieldType: ['isBundleType', 'isMultiValue', 'valueType']}]},
  'canBeEmpty',
];

export const GROUP_SEARCH_FIELDS: QueryField = ['id', 'name', 'userCount'];

export const GROUP_MEMBERS_FIELDS: QueryField = [{ownUsers: ['id']}];

export const USER_SEARCH_FIELDS: QueryField = ['banned', 'login', 'id', 'name', 'fullName'];

export const USER_DETAILS_FIELDS: QueryField = [{userType: ['id']}, 'email', 'guest'];

export const TAG_SEARCH_FIELDS: QueryField = [
  'id',
  'name',
  {owner: ['id', 'login', 'name']},
  'isUsable',
  {
    tagSharingSettings: [
      'permissionBasedTagAccess',
      {permittedGroups: ['id', 'name']},
      {permittedUsers: ['id', 'login']},
    ],
  },
];

export const RULE_LOG_FIELDS: QueryField = ['id', 'level', 'timestamp', 'username', 'message', 'stacktrace'];

export const WORKFLOW_LOG_RESOLVE_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  {rules: ['id', 'name', 'title', 'type']},
];

export const APP_USAGE_UPDATE_FIELDS: QueryField = [
  'id',
  'canUpdate',
  'isBroken',
  'enabled',
  'isActive',
  'missingRequiredSettings',
  {project: ['id', 'name', 'icon', 'iconUrl', 'shortName', 'template']},
];

export function normalizeAppId(app: string): string {
  return app.toString().replace(/^@/, '');
}

export function formatBoolean(value: boolean | undefined): string {
  if (value === undefined) {
    return 'unknown';
  }
  return value ? 'yes' : 'no';
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printYaml(data: unknown): void {
  console.log(stringifyYaml(data).trimEnd());
}

export function formatProjectLabel(project: AppProject | ProjectDetails): string {
  return project.shortName ?? project.name ?? project.id ?? 'unknown';
}

export function findUsageForProject(app: AppDetails, project: ProjectDetails): AppUsage | undefined {
  return (app.usages ?? []).find(candidate => {
    return candidate.project?.id === project.id || candidate.project?.shortName === project.shortName;
  });
}

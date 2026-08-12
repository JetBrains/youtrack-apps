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

export interface AppVendor {
  name?: string;
  url?: string;
  email?: string;
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
  $type?: string;
  id?: string;
  name?: string;
  title?: string;
  typeAlias?: string;
  description?: string | null;
  isGlobal?: boolean;
  script?: AppScript;
  usages?: PluggableObjectUsage[];
}

export interface AppScript {
  id?: string;
  name?: string;
  script?: string;
  traceEnabled?: boolean;
  updated?: number;
  updatedBy?: {
    id?: string;
    login?: string;
    name?: string;
  };
}

export interface AppFileContent {
  id?: string;
  content?: string;
  editable?: boolean;
  updated?: number;
  updatedBy?: UserReference | null;
}

export interface WidgetPermission {
  key?: string;
  visibleName?: string;
}

export interface WidgetExtensionPoint {
  id?: string;
  type?: string;
}

export interface AppWidget {
  $type?: string;
  id?: string;
  name?: string;
  indexPath?: string;
  iconPath?: string | null;
  globalConfig?: {
    enabled?: boolean;
  };
  permissions?: WidgetPermission[];
  extensionPoint?: WidgetExtensionPoint;
}

export interface AdminWidget {
  $type?: string;
  id?: string;
  key?: string;
  name?: string;
  description?: string;
  appName?: string;
  appTitle?: string;
  indexPath?: string;
  extensionPoint?: string;
  configurable?: boolean;
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
  vendor?: AppVendor;
  canBeAttached?: boolean;
  hasWidgetOrHttp?: boolean;
  fromMarketplace?: boolean;
  marketplaceId?: number;
  availableUpdateId?: string | number | null;
  availableUpdateVersion?: string | null;
  icon?: string | null;
  darkIcon?: string | null;
  permanent?: boolean;
  autoAttach?: boolean;
  updated?: number;
  hasBrokenUsages?: boolean;
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
  widgets?: AppWidget[];
  adminWidgets?: AdminWidget[];
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
  permittedUsers?: {id?: string; login?: string; name?: string}[];
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
    localizedName?: string;
    fieldType?: ProjectFieldType;
  };
  bundle?: {
    id?: string;
    values?: CustomFieldValue[];
  };
  canBeEmpty?: boolean;
}

export interface CustomFieldValue {
  id?: string;
  name?: string;
  localizedName?: string;
  login?: string;
  fullName?: string;
  presentation?: string;
  minutes?: number;
  color?: {
    id?: string;
    foreground?: string;
    background?: string;
  };
}

export interface IssueFieldSchema {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  items?: IssueFieldSchema;
  readOnly?: boolean;
  [key: string]: unknown;
}

export interface IssueFieldsSchema {
  type?: string;
  properties?: Record<string, IssueFieldSchema>;
  required?: string[];
  [key: string]: unknown;
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
  id?: string;
  name?: string;
  userCount?: number;
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
  id?: string;
  banned?: boolean;
  login?: string;
  name?: string;
  fullName?: string;
  userType?: {
    id?: string;
  };
  email?: string;
  guest?: boolean;
}

export interface ProjectFieldsResult {
  project: ProjectDetails;
  schema: IssueFieldsSchema;
}

export interface GroupMembersResult {
  group: UserGroup;
  members: UserGroupMember[];
}

export type UserInfoResult = UserSummary & UserDetails;

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

export interface AppUsageProblem extends RuleProblem {
  pluggableObjectId?: string;
  pluggableObjectName?: string;
  pluggableObjectTitle?: string;
  pluggableObjectUsageId?: string;
}

export interface AppUsageDiagnostics extends AppUsage {
  problems: AppUsageProblem[];
}

export interface AppFileReference {
  key: string;
  label: string;
  type: 'manifest' | 'settings' | 'entityExtensions' | 'script';
  id?: string;
  name?: string;
  aliases?: string[];
}

export interface AppModuleReference {
  id?: string;
  name: string;
  description?: string | null;
  file?: string;
  type?: string;
  scriptId?: string;
}

export interface AppCatalogResult {
  app: AppDetails;
  files: AppFileReference[];
  modules: AppModuleReference[];
}

export interface AppFileResult {
  app: AppDetails;
  file: AppFileReference;
  content: string;
}

export interface VisibilityResult {
  app: AppDetails;
  project?: ProjectDetails;
  visibilitySettings?: VisibilitySettings;
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

export const APP_LIST_FIELDS: QueryField = [
  'id',
  'name',
];

export const APP_RESOLVE_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  {globalConfig: ['enabled']},
  {usages: ['id', 'enabled', 'isBroken', 'isActive', 'missingRequiredSettings', {project: ['id', 'name', 'shortName']}]},
];

export const APP_INFO_FIELDS: QueryField = [
  'id',
  'name',
  'title',
  'version',
  'description',
  'canBeAttached',
  'hasWidgetOrHttp',
  'fromMarketplace',
  'marketplaceId',
  'availableUpdateId',
  'availableUpdateVersion',
  'icon',
  'darkIcon',
  'permanent',
  'autoAttach',
  'updated',
  'hasBrokenUsages',
  {tags: ['name']},
  {vendor: ['name', 'url', 'email']},
  {globalConfig: ['enabled', 'missingRequiredSettings']},
  {
    widgets: [
      '$type',
      'id',
      'name',
      'indexPath',
      'iconPath',
      {globalConfig: ['enabled']},
      {permissions: ['key', 'visibleName']},
      {extensionPoint: ['id', '$type']},
    ],
  },
  {
    adminWidgets: [
      '$type',
      'id',
      'key',
      'name',
      'description',
      'appName',
      'appTitle',
      'indexPath',
      'extensionPoint',
      'configurable',
    ],
  },
  {manifestFile: ['id', 'editable', 'updated']},
  {settingsFile: ['id', 'editable', 'updated']},
  {entityExtensionsFile: ['id', 'editable', 'updated']},
  {
    pluggableObjects: [
      '$type',
      'id',
      'name',
      'title',
      'description',
      'typeAlias',
      'isGlobal',
      {script: ['id', 'name', 'traceEnabled', 'updated', {updatedBy: ['id', 'login', 'name']}]},
    ],
  },
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
      {script: ['id', 'name', 'script', 'traceEnabled', 'updated', {updatedBy: ['login']}]},
    ],
  },
];

export const APP_USAGE_FIELDS: QueryField = [
  'id',
  'enabled',
  'isBroken',
  'isActive',
  'missingRequiredSettings',
  {project: ['id', 'name', 'shortName']},
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

export const PROJECT_APP_CONFIG_LIST_FIELDS: QueryField = [
  'id',
  {app: ['id', 'name', 'title', {globalConfig: ['enabled', 'missingRequiredSettings']}]},
  {project: ['id', 'shortName', 'name']},
  'enabled',
  'isActive',
  'missingRequiredSettings',
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
  {
    field: [
      'name',
      'localizedName',
      'id',
      {fieldType: ['isBundleType', 'isMultiValue', 'valueType']},
    ],
  },
  {
    bundle: [
      'id',
      {
        values: [
          'id',
          'name',
          'localizedName',
          'login',
          'fullName',
          'presentation',
          'minutes',
          {color: ['id', 'foreground', 'background']},
        ],
      },
    ],
  },
  'canBeEmpty',
];

export const GROUP_SEARCH_FIELDS: QueryField = ['id', 'name', 'userCount'];

export const GROUP_MEMBERS_FIELDS: QueryField = ['id', 'name', 'userCount', {ownUsers: ['id']}];

export const USER_SEARCH_FIELDS: QueryField = ['banned', 'login', 'id', 'name', 'fullName'];

export const USER_DETAILS_FIELDS: QueryField = ['banned', 'login', 'id', 'name', 'fullName', {userType: ['id']}, 'email', 'guest'];

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

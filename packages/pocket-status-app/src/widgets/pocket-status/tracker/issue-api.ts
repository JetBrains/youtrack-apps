import {InstanceAwareAPILayer} from '../../../../@types/globals';
import {StatusValue} from '../../shared/types.ts';

// Single-value fields whose values have colors, so they read as a status tag
const TRACKABLE_TYPES = ['StateIssueCustomField', 'SingleEnumIssueCustomField', 'SingleOwnedIssueCustomField'];

export interface TrackedField {
  id: string;
  name: string;
  $type: string;
  // A private field needs an extra permission to change
  isPublic: boolean;
  value: StatusValue | null;
  // Values the field can take in the issue's project, archived ones left out
  values: StatusValue[];
}

export interface TrackedIssue {
  id: string;
  idReadable: string;
  projectId: string;
  summary: string;
  fields: TrackedField[];
}

interface BundleValue {
  name: string;
  archived?: boolean;
  color?: {id: string; background: string; foreground: string};
}

interface IssueResponse {
  id: string;
  idReadable: string;
  summary: string;
  project: {id: string};
  customFields: {
    id: string;
    name: string;
    $type: string;
    value: BundleValue | null;
    projectCustomField?: {isPublic?: boolean; bundle?: {values?: BundleValue[]}};
  }[];
}

const COLOR = 'color(id,background,foreground)';
const FIELDS = `id,idReadable,summary,project(id),customFields(id,name,$type,value(name,${COLOR}),projectCustomField(isPublic,bundle(values(name,archived,${COLOR}))))`;
// Color `0` means the value has no color in YouTrack
const NO_COLOR = '0';

const toStatus = ({name, color}: BundleValue): StatusValue => {
  const colored = color && color.id !== NO_COLOR;
  return {
    name,
    color: colored ? color.background : 'var(--ring-tag-background-color)',
    textColor: colored ? color.foreground : 'var(--ring-text-color)'
  };
};

const toIssue = (issue: IssueResponse): TrackedIssue => ({
  id: issue.id,
  idReadable: issue.idReadable,
  projectId: issue.project.id,
  summary: issue.summary,
  fields: issue.customFields.
    filter(field => TRACKABLE_TYPES.includes(field.$type)).
    map(field => ({
      id: field.id,
      name: field.name,
      $type: field.$type,
      isPublic: field.projectCustomField?.isPublic !== false,
      value: field.value ? toStatus(field.value) : null,
      values: (field.projectCustomField?.bundle?.values ?? []).filter(value => !value.archived).map(toStatus)
    }))
});

export const issueUrl = (idReadable: string) => `${YTApp.baseUrl.replace(/\/api\/?$/, '')}/issue/${idReadable}`;

// A field picked by name, or the first State field for a widget that has no field name stored
export const findField = (issue: TrackedIssue, fieldName?: string) => (fieldName
  ? issue.fields.find(field => field.name === fieldName)
  : issue.fields.find(field => field.$type === 'StateIssueCustomField'));

// Read and written as the viewing user, so YouTrack applies that user's access rights and workflows
export async function loadIssue(host: InstanceAwareAPILayer, issueId: string): Promise<TrackedIssue> {
  const issue = await host.fetchYouTrack<IssueResponse>(`issues/${encodeURIComponent(issueId)}`, {query: {fields: FIELDS}});
  return toIssue(issue);
}

export async function setFieldValue(
  host: InstanceAwareAPILayer,
  issue: TrackedIssue,
  field: TrackedField,
  valueName: string
): Promise<TrackedIssue> {
  const updated = await host.fetchYouTrack<IssueResponse>(`issues/${issue.id}`, {
    method: 'POST',
    query: {fields: FIELDS},
    body: {customFields: [{id: field.id, $type: field.$type, value: {name: valueName}}]}
  });
  return toIssue(updated);
}

interface PermissionEntry {
  global: boolean;
  permission: {key: string};
  projects?: {id: string}[];
}

const UPDATE_ISSUE = 'JetBrains.YouTrack.UPDATE_ISSUE';
const PRIVATE_UPDATE_ISSUE = 'JetBrains.YouTrack.PRIVATE_UPDATE_ISSUE';

// The permissions of the viewing user, in all projects at once
export const loadPermissions = (host: InstanceAwareAPILayer) =>
  host.fetchYouTrack<PermissionEntry[]>('permissions/cache', {query: {fields: 'global,permission(key),projects(id)'}});

const hasPermission = (permissions: PermissionEntry[], key: string, projectId: string) =>
  permissions.some(entry => entry.permission.key === key &&
    (entry.global || Boolean(entry.projects?.some(project => project.id === projectId))));

// Only hides the control: YouTrack still checks the change, including workflow rules
export const canUpdateField = (permissions: PermissionEntry[], issue: TrackedIssue, field: TrackedField) =>
  hasPermission(permissions, UPDATE_ISSUE, issue.projectId) &&
  (field.isPublic || hasPermission(permissions, PRIVATE_UPDATE_ISSUE, issue.projectId));

export type Permissions = PermissionEntry[];

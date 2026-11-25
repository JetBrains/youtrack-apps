import {InstanceAwareAPILayer} from '../../../@types/globals';

import {StatesSet} from './types.ts';

// Where a list of sets lives: a project, or the personal sets of one user
export type SetsScope = {kind: 'project' | 'user'; id: string};

export interface LoadedSets {
  sets: StatesSet[];
  canEdit: boolean;
  // The app setting; only the project endpoint reports it
  issueTracking: boolean;
}

// Scoped endpoints live under their entity, so they are called through `fetchYouTrack`:
// `fetchApp` with `scope: true` would target the issue or article the widget sits in
// The owner ID comes from the widget config, which anyone who can edit the text can change,
// so only an ID in the YouTrack format goes into the path
const ENTITY_ID = /^\d+-\d+$/;

const setsUrl = ({kind, id}: SetsScope) => {
  if (!ENTITY_ID.test(id)) {
    throw new Error(`Not a valid ${kind} ID`);
  }
  const path = encodeURIComponent(id);
  return kind === 'project'
    ? `admin/projects/${path}/extensionEndpoints/pocket-status/backend-project/sets`
    : `users/${path}/extensionEndpoints/pocket-status/backend-user/sets`;
};

// Article drafts are not found under `articles/`; issue drafts are found under `issues/`
function entityPath(entity: NonNullable<typeof YTApp.entity>): string | null {
  if (entity.type === 'article') {
    return entity.draft ? `users/me/articleDrafts/${entity.id}` : `articles/${entity.id}`;
  }
  return entity.type === 'issue' || entity.type === 'ticket' ? `issues/${entity.id}` : null;
}

// A MARKDOWN widget only knows the entity it is embedded in, so its project has to be fetched
export async function resolveProjectId(host: InstanceAwareAPILayer): Promise<string | null> {
  const entity = YTApp.entity;
  if (entity?.type === 'project') {
    return entity.id;
  }
  const path = entity && entityPath(entity);
  if (!path) {
    return null;
  }
  const result = await host.fetchYouTrack<{project?: {id?: string}}>(path, {query: {fields: 'project(id)'}});
  return result.project?.id ?? null;
}

export async function loadSets(host: InstanceAwareAPILayer, scope: SetsScope): Promise<LoadedSets> {
  const data = await host.fetchYouTrack<{sets: string; canEdit: boolean; issueTracking?: boolean}>(setsUrl(scope), {});
  return {sets: JSON.parse(data.sets).sets, canEdit: data.canEdit, issueTracking: data.issueTracking !== false};
}

export async function saveSets(host: InstanceAwareAPILayer, scope: SetsScope, sets: StatesSet[]): Promise<void> {
  await host.fetchYouTrack(setsUrl(scope), {method: 'POST', body: {sets: JSON.stringify({sets})}});
}

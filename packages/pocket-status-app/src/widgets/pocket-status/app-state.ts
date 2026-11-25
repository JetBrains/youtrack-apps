import {makeAutoObservable, runInAction} from 'mobx';
import {AlertType} from '@jetbrains/ring-ui-built/components/alert/alert';

import {EmbeddableWidgetAPI} from '../../../@types/globals';
import {StatesSet, StatusValue, WidgetConfiguration} from '../shared/types.ts';
import {LoadedSets, loadSets, resolveProjectId, saveSets, SetsScope} from '../shared/sets-api.ts';

import {initHost} from './host.ts';
import {
  canUpdateField, findField, loadIssue, loadPermissions, Permissions, setFieldValue, TrackedField, TrackedIssue
} from './tracker/issue-api.ts';

const ISSUE_POLL_MS = 30000;
// The host passes `editable=true` in the hash when the user can edit the text that holds the widget
const HOST_EDITABLE = new URLSearchParams(window.location.hash.slice(1)).get('editable') === 'true';

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e));

class AppState {
  constructor() {
    makeAutoObservable<this, 'projectPromise' | 'setsPromise' | 'pollingStarted'>(this, {
      host: false, projectPromise: false, setsPromise: false, pollingStarted: false
    });
  }

  config: WidgetConfiguration | undefined = undefined;
  // Three lists: the project sets, my personal sets, and the personal sets of another user
  // when the widget shows a status from them. A set is found by its name and owner; no owner means a project set.
  sets: Array<StatesSet> = [];
  userSets: Array<StatesSet> = [];
  ownerSets: Array<StatesSet> = [];
  selectedSet: StatesSet | undefined = undefined;
  selectedOwner: string | undefined = undefined;
  // The app setting for this project; on when the project sets cannot load
  issueTracking = true;
  currentWidgetState: 'config' | 'view' | 'create' | 'pick' = 'view';
  loading = true;
  setsLoading = false;
  // The project of the entity does not change, so it is resolved once
  private projectPromise: Promise<string> | null = null;
  // The sets load once per page; values added later arrive after a reload
  private setsPromise: Promise<boolean> | null = null;
  projectId: string | null = null;
  canEdit = false;
  // The set the form edits; `null` while the form creates a new set
  editingSet: StatesSet | null = null;
  editingOwner: string | undefined = undefined;
  // The tracked issue as the viewer sees it; `null` until it loads or when the viewer cannot read it
  issue: TrackedIssue | null = null;
  // The viewer cannot see the tracked issue: the widget shows a "Restricted issue" placeholder
  issueHidden = false;
  permissions: Permissions | null = null;
  // While the widget sets a value, a poll must not bring back the old one
  switchingValue = false;
  private pollingStarted = false;

  host: EmbeddableWidgetAPI | null = null;

  // Colors come from the current set when it is loaded, so a recolored value shows up
  get currentStatus(): StatusValue | null {
    const {config} = this;
    if (!config?.name) {
      return null;
    }
    const value = this.selectedSet?.values.find(item => item.name === config.name);
    return value ?? {
      name: config.name,
      color: config.backgroundColor ?? 'var(--ring-tag-background-color)',
      textColor: config.textColor ?? 'var(--ring-text-color)'
    };
  }

  // The ID from YouTrack once the issue loads, otherwise the stored one
  get trackedIssueId(): string {
    return this.issue?.idReadable ?? this.config?.issueId ?? '';
  }

  alert(message: string, e: unknown) {
    this.host?.alert(`${message}: ${errorMessage(e)}`, AlertType.ERROR);
  }

  // The status view needs only the widget config, which every reader gets.
  // The project sets load once in the background, so a click switches the status at once.
  async init() {
    this.host = await initHost({
      // Adds "Edit..." to the widget menu: the only way to change the set once a status is picked
      onConfigure: () => this.openConfig(),
      // Adds a refresh button to the widget header; a tracked issue loads again
      onRefresh: () => this.refreshIssue(),
      onModalModeChange: ({isModal}) => {
        if (!isModal) {
          runInAction(() => {
            this.currentWidgetState = 'view';
          });
        }
      }
    });
    const config = await this.host.readConfig<WidgetConfiguration>().catch(() => null);
    runInAction(() => {
      this.loading = false;
      if (config?.issueId || (config?.key && config?.name)) {
        this.config = config;
      }
    });
    if (this.config?.issueId) {
      // The app setting comes with the project sets; with tracking off the issue is not read at all
      this.ensureSets(true).then(() => {
        if (this.issueTracking) {
          this.startIssuePolling();
        }
      });
    } else if (this.config) {
      // Quiet: a reader in a project without the app still sees the stored status
      this.ensureSets(true);
    } else {
      this.openConfig();
    }
  }

  // Polling is the only way to see changes made elsewhere: YouTrack does not push them to widgets
  // Starts once and always reads the stored issue ID, so switching to another issue needs no restart
  startIssuePolling() {
    if (this.pollingStarted) {
      return;
    }
    this.pollingStarted = true;
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        this.refreshIssue();
      }
    };
    // ponytail: one request per widget every 30s while the page is visible; a shared poll per page if that gets heavy
    window.setInterval(refresh, ISSUE_POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    this.refreshIssue();
  }

  // Quiet: a viewer who cannot read the issue sees only its ID, and a failed poll keeps the last value
  async refreshIssue() {
    const issueId = this.config?.issueId;
    if (!this.host || !issueId || this.switchingValue) {
      return;
    }
    try {
      const issue = await loadIssue(this.host, issueId);
      runInAction(() => {
        // Drops a late answer for an issue the widget no longer tracks
        if (!this.switchingValue && this.config?.issueId === issueId) {
          this.issue = issue;
          this.issueHidden = false;
        }
      });
      this.ensurePermissions();
    } catch {
      // The first load decides; a failed poll later keeps what is shown
      runInAction(() => {
        if (!this.issue) {
          this.issueHidden = true;
        }
      });
    }
  }

  // Loaded once; without them the widget does not offer to change the issue
  async ensurePermissions() {
    if (this.permissions || !this.host || !HOST_EDITABLE) {
      return;
    }
    try {
      const permissions = await loadPermissions(this.host);
      runInAction(() => {
        this.permissions = permissions;
      });
    } catch {
      // The value picker stays hidden
    }
  }

  // The field the widget shows; a widget without a stored field name shows the State field
  get trackedField(): TrackedField | undefined {
    return this.issue ? findField(this.issue, this.config?.fieldName) : undefined;
  }

  // The viewer can open the value picker: YouTrack opens the widget dialog only where the text is editable,
  // and the viewer must be allowed to update the tracked field
  get canPickTrackedValue(): boolean {
    const {issue, trackedField: field, permissions} = this;
    return HOST_EDITABLE && Boolean(issue && field && permissions && canUpdateField(permissions, issue, field));
  }

  // A status from a set is stored in the widget config, which only a user who can edit the text can change
  get canSwitchStatus(): boolean {
    return HOST_EDITABLE;
  }

  openValuePicker() {
    if (this.canPickTrackedValue) {
      this.currentWidgetState = 'pick';
    }
  }

  // Sets the value the user picked. Workflows can reject it, so the value is not guessed by cycling.
  async setTrackedValue(value: StatusValue) {
    const {host, issue, trackedField: field} = this;
    if (!host || !issue || !field) {
      return;
    }
    const previous = field.value;
    this.switchingValue = true;
    field.value = value;
    this.currentWidgetState = 'view';
    try {
      const updated = await setFieldValue(host, issue, field, value.name);
      runInAction(() => {
        this.issue = updated;
      });
    } catch (e) {
      runInAction(() => {
        field.value = previous;
      });
      // A workflow or missing permission can reject the change; YouTrack's message says why
      this.alert(`Could not set ${field.name}`, e);
    } finally {
      runInAction(() => {
        this.switchingValue = false;
      });
    }
  }

  // The issue with its trackable fields, or the problem to show in the form
  async findIssue(issueId: string): Promise<TrackedIssue | string> {
    if (!this.host) {
      return 'The widget is not ready';
    }
    try {
      const issue = await loadIssue(this.host, issueId);
      return issue.fields.length ? issue : 'This issue has no field with colored values to track';
    } catch {
      return 'No issue with this ID, or you cannot see it';
    }
  }

  async trackIssue(issue: TrackedIssue, fieldName: string) {
    // Only the ID and field name: the config is readable by anyone who can read the text
    await this.saveConfig({isConfigured: true, issueId: issue.idReadable, fieldName});
    runInAction(() => {
      this.issue = issue;
      this.issueHidden = false;
      this.currentWidgetState = 'view';
    });
    this.ensurePermissions();
    this.startIssuePolling();
  }

  openSetForm(set: StatesSet | null = null, owner?: string) {
    this.editingSet = set;
    this.editingOwner = owner;
    this.currentWidgetState = 'create';
  }

  closeSetForm(savedName?: string, owner?: string) {
    if (savedName) {
      this.selectSet(savedName, owner);
    }
    this.editingSet = null;
    this.editingOwner = undefined;
    this.currentWidgetState = 'config';
  }

  listFor(owner?: string): StatesSet[] {
    if (!owner) {
      return this.sets;
    }
    return owner === YTApp.me.id ? this.userSets : this.ownerSets;
  }

  // Team members change project sets; only the owner changes personal ones
  canEditSet(owner?: string): boolean {
    return owner ? owner === YTApp.me.id : this.canEdit;
  }

  openConfig() {
    this.currentWidgetState = 'config';
    this.ensureSets();
  }

  // A failed load is not kept, so the next click or config open tries again
  ensureSets(quiet = false): Promise<boolean> {
    if (!this.setsPromise) {
      this.setsPromise = this.refreshSets(quiet).then(loaded => {
        if (!loaded) {
          this.setsPromise = null;
        }
        return loaded;
      });
    }
    return this.setsPromise;
  }

  private resolveProject(): Promise<string> {
    if (!this.projectPromise) {
      const host = this.host as EmbeddableWidgetAPI;
      this.projectPromise = resolveProjectId(host).then(projectId => {
        if (!projectId) {
          throw new Error('the widget works only in issues and articles of a project');
        }
        runInAction(() => {
          this.projectId = projectId;
        });
        return projectId;
      });
      this.projectPromise.catch(() => {
        this.projectPromise = null;
      });
    }
    return this.projectPromise;
  }

  // The project sets fail where the app is not attached; personal sets still work there
  async refreshSets(quiet = false): Promise<boolean> {
    if (!this.host) {
      return false;
    }
    // The loader shows only until the first sets arrive; a reload after adding a set updates the dialog in place
    this.setsLoading = this.sets.length === 0 && this.userSets.length === 0;
    const [project, mine, others] = await this.loadAllSets(this.host);
    this.applySets(project, mine, others);
    const failed = [project, mine].find(result => result.status === 'rejected');
    if (failed && !quiet) {
      this.alert('Could not load all status sets', (failed as PromiseRejectedResult).reason);
    }
    return project.status === 'fulfilled' || mine.status === 'fulfilled';
  }

  private loadAllSets(host: EmbeddableWidgetAPI) {
    const owner = this.config?.setOwner;
    const otherOwner = owner && owner !== YTApp.me.id ? owner : null;
    return Promise.allSettled([
      this.resolveProject().then(id => loadSets(host, {kind: 'project', id})),
      loadSets(host, {kind: 'user', id: YTApp.me.id}),
      otherOwner ? loadSets(host, {kind: 'user', id: otherOwner}) : Promise.resolve(null)
    ]);
  }

  // A failed list keeps what it had
  private applySets(
    project: PromiseSettledResult<LoadedSets>,
    mine: PromiseSettledResult<LoadedSets>,
    others: PromiseSettledResult<LoadedSets | null>
  ) {
    if (project.status === 'fulfilled') {
      this.sets = project.value.sets;
      this.canEdit = project.value.canEdit;
      this.issueTracking = project.value.issueTracking;
    }
    if (mine.status === 'fulfilled') {
      this.userSets = mine.value.sets;
    }
    if (others.status === 'fulfilled' && others.value) {
      this.ownerSets = others.value.sets;
    }
    this.restoreState();
    this.setsLoading = false;
  }

  // The stored status, when it comes from the set picked in the dialog
  get currentValueName(): string | undefined {
    const {config, selectedSet, selectedOwner} = this;
    return config?.key === selectedSet?.name && config?.setOwner === selectedOwner ? config?.name : undefined;
  }

  // Where a new set goes: the project for a user who may change project sets, otherwise the user's own sets
  get newSetOwner(): string | undefined {
    return this.canEdit ? undefined : YTApp.me.id;
  }

  // Saving a new set with a taken name would replace the existing set
  isSetNameTaken(name: string, owner?: string): boolean {
    return this.listFor(owner).some(set => set.name === name);
  }

  // Keeps the set picked in the open dialog, otherwise takes the set of the stored status
  restoreState() {
    const name = this.selectedSet?.name ?? this.config?.key;
    const owner = this.selectedSet ? this.selectedOwner : this.config?.setOwner;
    if (name) {
      this.selectSet(name, owner);
    }
  }

  selectSet(name: string, owner?: string) {
    this.selectedSet = this.listFor(owner).find(set => set.name === name);
    this.selectedOwner = this.selectedSet ? owner : undefined;
  }

  // Shows the new status at once and goes back to the old one if the host does not store it,
  // for example for a reader who cannot edit the text
  async saveConfig(newConfig: WidgetConfiguration) {
    const previous = this.config;
    this.config = newConfig;
    try {
      await this.host?.storeConfig(newConfig);
    } catch (e) {
      runInAction(() => {
        this.config = previous;
      });
      this.alert('Could not change the status', e);
    }
  }

  // The widget is too small to show a dropdown inside its iframe, so a click moves to the next value
  async switchToNextValue() {
    await this.ensureSets();
    const values = this.selectedSet?.values;
    if (!values?.length) {
      this.openConfig();
      return;
    }
    const index = values.findIndex(value => value.name === this.config?.name);
    const next = values[(index + 1) % values.length];
    await this.saveConfig({
      isConfigured: true,
      key: this.selectedSet?.name,
      setOwner: this.selectedOwner,
      name: next.name,
      backgroundColor: next.color,
      textColor: next.textColor
    });
  }

  // Replaces the set with the same name in place, or adds it at the end of its list
  async saveSet(newSet: StatesSet, owner?: string): Promise<boolean> {
    if (!this.host || (!owner && !this.projectId)) {
      return false;
    }
    const list = this.listFor(owner);
    const exists = list.some(set => set.name === newSet.name);
    const sets = exists ? list.map(set => (set.name === newSet.name ? newSet : set)) : [...list, newSet];
    const scope: SetsScope = owner ? {kind: 'user', id: owner} : {kind: 'project', id: this.projectId as string};
    try {
      await saveSets(this.host, scope, sets);
      await this.refreshSets();
      return true;
    } catch (e) {
      this.alert('Could not save the status set', e);
      return false;
    }
  }
}

const appState = new AppState();
export default appState;

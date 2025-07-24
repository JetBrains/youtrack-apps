---
to: "src/api/youtrack-types.d.ts"
---
/**
 * YouTrack Workflow API Type Definitions
 * Generated from workflowJsStubs.js using AST-based converter
 *
 * @generated Do not edit manually
 */

/**
 * Base entity interface that all YouTrack entities extend
 */
export interface BaseEntity {
    readonly becomesRemoved?: boolean;
    readonly isNew?: boolean;
  readonly [key: string]: unknown;
}

/**
 * Represents VCS-related items such as commits and pull requests.
 */
export interface AbstractVcsItem {
  readonly branch?: string;
  readonly text?: string;
  readonly user?: User;
  readonly userName?: string;

  readonly [key: string]: unknown;
}

/**
 * Represents an agile board and the set of sprints that belong to the board.
 */
export interface Agile {
  readonly currentSprint?: Sprint;
  readonly author?: User;
  readonly name?: string;
  readonly sprints?: Sprint[];

  addIssue(issue: unknown): void;
  containsIssue(issue: unknown): void;
  findSprintByName(name: unknown): void;
  getAddedSprints(issue: unknown): void;
  getIssueSprints(issue: unknown): void;
  getRemovedSprints(issue: unknown): void;
  getSprints(issue: unknown): void;
  isAdded(issue: unknown): void;
  isRemoved(issue: unknown): void;
  removeIssue(issue: unknown): void;
  readonly [key: string]: unknown;
}

export interface Article {
  readonly editedComments?: ArticleComment[];
  readonly id?: string;
  readonly pinnedComments?: ArticleComment[];
  readonly url?: string;
  readonly childArticles?: Article[];
  readonly comments?: ArticleComment[];
  readonly created?: number;
  readonly numberInProject?: number;
  readonly parentArticle?: Article;
  readonly project?: Project;
  readonly updated?: number;
  readonly updatedBy?: User;

  addAttachment(content: unknown, name: unknown, charset: unknown, mimeType: unknown): void;
  addComment(text: unknown, author: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a file that is attached to an article.
 */
export interface ArticleAttachment extends BaseArticleAttachment {

  readonly [key: string]: unknown;
}

/**
 * Represents a comment that is added to an article.
 */
export interface ArticleComment extends BaseArticleComment {
  readonly article?: Article;
  readonly author?: User;

  readonly [key: string]: unknown;
}

/**
 * The base class for article.
 */
export interface BaseArticle {
  readonly isStarred?: boolean;
  readonly attachments?: BaseArticleAttachment[];
  readonly author?: User;
  readonly content?: string;
  readonly summary?: string;
  readonly tags?: Tag[];

  addTag(name: unknown): void;
  hasTag(tagName: unknown): void;
  removeTag(name: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * The base class for article comment.
 */
export interface BaseArticleAttachment extends PersistentFile {

  readonly [key: string]: unknown;
}

/**
 * The base class for article comment.
 */
export interface BaseArticleComment {
  readonly attachments?: BaseArticleAttachment[];
  readonly created?: number;
  readonly isPinned?: boolean;
  readonly text?: string;
  readonly updated?: number;

  readonly [key: string]: unknown;
}

/**
 * The base class for issue comment.
 */
export interface BaseComment {
  readonly attachments?: IssueAttachment[];
  readonly created?: number;
  readonly isPinned?: boolean;
  readonly text?: string;
  readonly updated?: number;

  readonly [key: string]: unknown;
}

/**
 * The base class for issue work items.
 */
export interface BaseWorkItem {
  readonly author?: User;
  readonly created?: number;
  readonly creator?: User;
  readonly description?: string;
  readonly type?: WorkItemType;
  readonly updated?: number;

  readonly [key: string]: unknown;
}

/**
 * Represents a value that is stored in a custom field that stores a build type.
 */
export interface Build extends Field {
  readonly assembleDate?: number;

  readonly [key: string]: unknown;
}

/**
 * Represents a value-based condition for a custom field in a specific project.
 */
export interface BundleElementCondition {
  readonly bundleElement?: Field;
  readonly possibleValues?: Field[];

  readonly [key: string]: unknown;
}

/**
 * Represents a custom field in a project that stores a predefined set of values.
 */
export interface BundleProjectCustomField extends ProjectCustomField {
  readonly values?: Field[];
  readonly defaultValues?: Field[];
  readonly valuesCondition?: FieldBasedBundleValuesCondition;

  createValue(name: unknown): void;
  findValueByName(name: unknown): void;
  findValueByOrdinal(ordinal: unknown): void;
  getPossibleValuesForIssue(issue: unknown): void;
  isValuePermittedInIssue(issue: unknown, value: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a group of 24x7 business hours settings in a helpdesk project. In the Workflow API, such a group is called a Calendar24x7.
 */
export interface Calendar24x7 extends Calendar {

  readonly [key: string]: unknown;
}

/**
 * An entity that retrieves VCS changes and creates their representation in YouTrack.
 */
export interface ChangesProcessor {
  readonly pullRequests?: PullRequest[];
  readonly url?: string;
  readonly vcsChanges?: VcsChange[];
  readonly server?: VcsServer;

  readonly [key: string]: unknown;
}

/**
 * Represents a channel used by customers to reach out to the helpdesk for support.
 */
export interface Channel {
  readonly name?: string;

  readonly [key: string]: unknown;
}

/**
 * Represents a value in a custom field that stores a predefined set of values.
 */
export interface EnumField extends Field {

  readonly [key: string]: unknown;
}

/**
 * Represents an online form used in a helpdesk project. Online forms provide customers with a web-based interface that they can use to submit inquiries, requests, or complaints.
 */
export interface FeedbackForm extends Channel {

  readonly [key: string]: unknown;
}

/**
 * Represents a value that is stored in a custom field.
 */
export interface Field {
  readonly backgroundColor?: string;
  readonly foregroundColor?: string;
  readonly presentation?: string;
  readonly isArchived?: boolean;
  readonly colorIndex?: number;
  readonly description?: string;
  readonly name?: string;
  readonly ordinal?: number;

  readonly [key: string]: unknown;
}

/**
 * Represents a value-based condition for a custom field in a specific project.
 */
export interface FieldBasedBundleValuesCondition extends FieldBasedValuesCondition {
  readonly conditions?: BundleElementCondition[];

  readonly [key: string]: unknown;
}

/**
 * Represents a value-based condition for a custom field that stores references to users.
 */
export interface FieldBasedUserValuesCondition extends FieldBasedValuesCondition {
  readonly conditions?: UserCondition[];

  readonly [key: string]: unknown;
}

/**
 * Represents the base entity for a value-based condition for a custom field in a project.
 */
export interface FieldBasedValuesCondition {
  readonly field?: BundleProjectCustomField;

  readonly [key: string]: unknown;
}

/**
 * Represents a Gantt chart.
 */
export interface Gantt {
  readonly startTimestamp?: number;
  readonly issues?: Issue[];
  readonly name?: string;
  readonly owner?: User;
  readonly projects?: Project[];

  addIssue(issue: unknown): void;
  containsIssue(issue: unknown): void;
  removeIssue(issue: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a custom field in a project that stores a UserGroup type.
 */
export interface GroupProjectCustomField extends ProjectCustomField {
  readonly values?: UserGroup[];

  findValueByName(name: unknown): void;
  readonly [key: string]: unknown;
}

export interface Issue {
  readonly becomesReported?: boolean;
  readonly becomesResolved?: boolean;
  readonly becomesUnresolved?: boolean;
  readonly duplicateRoot?: Issue;
  readonly editedComments?: IssueComment[];
  readonly editedWorkItems?: IssueWorkItem[];
  readonly id?: string;
  readonly pinnedComments?: IssueComment[];
  readonly pullRequests?: PullRequest[];
  readonly url?: string;
  readonly vcsChanges?: VcsChange[];
  readonly workItems?: IssueWorkItem[];
  readonly isReported?: boolean;
  readonly isResolved?: boolean;
  readonly isStarred?: boolean;
  readonly attachments?: IssueAttachment[];
  readonly channel?: Channel;
  readonly comments?: IssueComment[];
  readonly created?: number;
  readonly description?: string;
  readonly ganttCharts?: Gantt[];
  readonly numberInProject?: number;
  readonly permittedGroup?: UserGroup;
  readonly permittedGroups?: UserGroup[];
  readonly permittedUsers?: User[];
  readonly project?: Project;
  readonly reporter?: User;
  readonly resolved?: number;
  readonly summary?: string;
  readonly tags?: Tag[];
  readonly unauthenticatedReporter?: boolean;
  readonly updated?: number;
  readonly updatedBy?: User;
  readonly voters?: User[];
  readonly votes?: number;
  readonly fields?: Fields;
  readonly links?: Record<string, unknown>;

  addAttachment(content: unknown, name: unknown, charset: unknown, mimeType: unknown): void;
  addComment(text: unknown, author: unknown): void;
  addTag(name: unknown): void;
  addWorkItem(description: unknown, date: unknown, author: unknown, duration: unknown, type: unknown): void;
  afterMinutes(initialTime: unknown, minutes: unknown, calendar: unknown, considerPauses: unknown): void;
  applyCommand(command: unknown, runAs: unknown): void;
  clearAttachments(): void;
  copy(project: unknown): void;
  hasTag(tagName: unknown, ignoreVisibilitySettings: unknown): void;
  isVisibleTo(user: unknown): void;
  pauseSLA(): void;
  removeTag(name: unknown): void;
  renderMarkup(text: unknown): void;
  resumeSLA(): void;
  tag(tag: unknown): void;
  untag(tag: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a file that is attached to an issue.
 */
export interface IssueAttachment extends PersistentFile {
  readonly base64Content?: string;
  readonly content?: InputStream;
  readonly author?: User;
  readonly created?: number;
  readonly fileUrl?: string;
  readonly isRemoved?: boolean;
  readonly issue?: Issue;
  readonly metaData?: string;
  readonly permittedGroup?: UserGroup;
  readonly permittedGroups?: UserGroup[];
  readonly permittedUsers?: User[];
  readonly updated?: number;

  delete(): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a comment that is added to an issue.
 */
export interface IssueComment extends BaseComment {
  readonly url?: string;
  readonly author?: User;
  readonly deleted?: boolean;
  readonly issue?: Issue;
  readonly permittedGroup?: UserGroup;
  readonly permittedGroups?: UserGroup[];
  readonly permittedUsers?: User[];
  readonly updatedBy?: User;

  addAttachment(content: unknown, name: unknown, charset: unknown, mimeType: unknown): void;
  delete(): void;
  isVisibleTo(user: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents an issue link type.
 */
export interface IssueLinkPrototype {
  readonly inward?: string;
  readonly outward?: string;

  readonly [key: string]: unknown;
}

/**
 * Deprecated. Use Tag instead.
 */
export interface IssueTag extends WatchFolder {

  readonly [key: string]: unknown;
}

/**
 * Represents a work item that has been added to an issue.
 */
export interface IssueWorkItem extends BaseWorkItem {
  readonly date?: number;
  readonly duration?: number;
  readonly attributes?: WorkItemAttributes;

  delete(): void;
  readonly [key: string]: unknown;
}

/**
 * Represents an email channel used in a helpdesk project. Email channels pull messages from an external mail service and process them according to the channel settings.
 */
export interface MailboxChannel extends Channel {

  readonly [key: string]: unknown;
}

/**
 * Represents a value in a custom field that has a user associated with it, a so-called owner.
 */
export interface OwnedField extends Field {
  readonly owner?: User;

  readonly [key: string]: unknown;
}

/**
 * Represents a custom field in a project that stores a value as a period type.
 */
export interface PeriodProjectCustomField extends SimpleProjectCustomField {

  readonly [key: string]: unknown;
}

/**
 * Represents the common ancestor for all persistent files that are available in YouTrack.
 */
export interface PersistentFile {
  readonly charset?: string;
  readonly extension?: string;
  readonly mimeType?: string;
  readonly name?: string;
  readonly size?: number;

  readonly [key: string]: unknown;
}

/**
 * Represents a YouTrack project.
 */
export interface Project {
  readonly changesProcessors?: ChangesProcessor[];
  readonly fields?: ProjectCustomField[];
  readonly key?: string;
  readonly name?: string;
  readonly notificationEmail?: string;
  readonly team?: UserGroup;
  readonly workItemAttributes?: WorkItemProjectAttribute[];
  readonly isArchived?: boolean;
  readonly articles?: Article[];
  readonly description?: string;
  readonly issues?: Issue[];
  readonly leader?: User;
  readonly projectType?: ProjectType;
  readonly shortName?: string;

  findFieldByName(name: unknown): void;
  findWorkItemAttributeByName(name: unknown): void;
  intervalToWorkingMinutes(start: unknown, end: unknown): void;
  isAgent(user: unknown): void;
  newDraft(reporter: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a custom field that is available in a project.
 */
export interface ProjectCustomField {
  readonly localizedName?: string;
  readonly name?: string;
  readonly typeName?: string;
  readonly nullValueText?: string;

  becomesInvisibleInIssue(issue: unknown): void;
  becomesVisibleInIssue(issue: unknown): void;
  getBackgroundColor(issue: unknown): void;
  getForegroundColor(issue: unknown): void;
  getValuePresentation(issue: unknown): void;
  isVisibleInIssue(issue: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a project team.
 */
export interface ProjectTeam extends UserGroup {

  readonly [key: string]: unknown;
}

/**
 * Represents a classification that determines which basic features are available for use in a project.
 */
export interface ProjectType {
  readonly DEFAULT?: ProjectType;
  readonly HELPDESK?: ProjectType;
  readonly typeName?: string;

  readonly [key: string]: unknown;
}

/**
 * Represents a value in a custom field that stores a version type.
 */
export interface ProjectVersion extends Field {
  readonly isReleased?: boolean;
  readonly releaseDate?: number;
  readonly startDate?: number;

  readonly [key: string]: unknown;
}

/**
 * Represents a pull or merge request that is attached to an issue.
 */
export interface PullRequest extends AbstractVcsItem {
  readonly idReadable?: string;
  readonly previousState?: PullRequestState;
  readonly url?: string;
  readonly fetched?: number;
  readonly id?: string;
  readonly processor?: ChangesProcessor;
  readonly state?: PullRequestState;
  readonly title?: string;

  readonly [key: string]: unknown;
}

/**
 * Represents a pull request state.
 */
export interface PullRequestState {
  readonly DECLINED?: PullRequestState;
  readonly MERGED?: PullRequestState;
  readonly OPEN?: PullRequestState;
  readonly name?: string;

  readonly [key: string]: unknown;
}

/**
 * Represents a saved search.
 */
export interface SavedQuery extends WatchFolder {
  readonly name?: string;
  readonly owner?: User;
  readonly query?: string;

  readonly [key: string]: unknown;
}

/**
 * Represents a work days calendar in YouTrack.
 */
export interface SimpleCalendar extends Calendar {

  readonly [key: string]: unknown;
}

/**
 * Base class for custom fields that store simple values like strings and numbers.
 */
export interface SimpleProjectCustomField extends ProjectCustomField {

  readonly [key: string]: unknown;
}

/**
 * Represents a sprint that is associated with an agile board. Each sprint can include issues from one or more projects.
 */
export interface Sprint {
  readonly agile?: Agile;
  readonly finish?: number;
  readonly isArchived?: boolean;
  readonly name?: string;
  readonly start?: number;

  addIssue(issue: unknown): void;
  containsIssue(issue: unknown): void;
  isSwimlane(issue: unknown): void;
  removeIssue(issue: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a value in a custom field that stores a state type.
 */
export interface State extends Field {
  readonly isResolved?: boolean;

  readonly [key: string]: unknown;
}

export interface Tag {
  readonly name?: string;
  readonly owner?: User;
  readonly permittedTagUserGroups?: UserGroup[];
  readonly permittedTagUsers?: User[];

  canBeUsedForArticle(article: unknown, user: unknown): void;
  canBeUsedForIssue(issue: unknown, user: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a custom field that stores a string of characters as text. When displayed in an issue, the text is shown as formatted in Markdown.
 */
export interface TextProjectCustomField extends SimpleProjectCustomField {

  readonly [key: string]: unknown;
}

/**
 * Represents a user account in YouTrack.
 */
export interface User {
  readonly avatarUrl?: string;
  readonly firstDayOfWeeks?: number;
  readonly language?: string;
  readonly ringId?: string;
  readonly timeZoneId?: string;
  readonly visibleName?: string;
  readonly isBanned?: boolean;
  readonly isOnline?: boolean;
  readonly isSystem?: boolean;
  readonly email?: string;
  readonly fullName?: string;
  readonly isEmailVerified?: boolean;
  readonly login?: string;
  readonly registered?: number;
  readonly attributes?: UserAttributes;

  canUnvoteIssue(issue: unknown): void;
  canVoteIssue(issue: unknown): void;
  getSharedTag(name: unknown): void;
  getTag(name: unknown, createIfNotExists: unknown): void;
  hasRole(roleName: unknown, project: unknown): void;
  isInGroup(groupName: unknown): void;
  notify(subject: unknown, body: unknown, ignoreNotifyOnOwnChangesSetting: unknown, project: unknown): void;
  notifyOnCase(caseName: unknown, parameters: unknown, projectDocument: unknown): void;
  sendMail(subject: unknown, body: unknown): void;
  unvoteIssue(issue: unknown): void;
  unwatchArticle(article: unknown): void;
  unwatchIssue(issue: unknown): void;
  voteIssue(issue: unknown): void;
  watchArticle(article: unknown): void;
  watchIssue(issue: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a value-based condition for a custom field in a specific project, where the field stores references to a user.
 */
export interface UserCondition {
  readonly bundleElement?: Field;
  readonly possibleValues?: User[];

  readonly [key: string]: unknown;
}

/**
 * Represents a group of users.
 */
export interface UserGroup {
  readonly isAutoJoin?: boolean;
  readonly users?: User[];
  readonly description?: string;
  readonly isAllUsersGroup?: boolean;
  readonly name?: string;

  notifyAllUsers(subject: unknown, body: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a custom field in a project that stores values as a user type.
 */
export interface UserProjectCustomField extends ProjectCustomField {
  readonly values?: User[];
  readonly defaultUsers?: User[];
  readonly valuesCondition?: FieldBasedUserValuesCondition;

  findValueByLogin(login: unknown): void;
  getPossibleValuesForIssue(issue: unknown): void;
  isValuePermittedInIssue(issue: unknown, value: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a commit that is attached to an issue.
 */
export interface VcsChange extends AbstractVcsItem {
  readonly changesProcessors?: ChangesProcessor[];
  readonly created?: number;
  readonly date?: number;
  readonly fetched?: number;
  readonly id?: number;
  readonly version?: string;

  extractCommands(user: unknown): void;
  getUrl(processor: unknown): void;
  isVisibleTo(user: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a VCS server.
 */
export interface VcsServer {
  readonly url?: string;

  readonly [key: string]: unknown;
}

/**
 * Represents a common ancestor of classes that represent tags and saved searches.
 */
export interface WatchFolder {
  readonly shareGroup?: UserGroup;
  readonly updateShareGroup?: UserGroup;
  readonly permittedReadUserGroups?: UserGroup[];
  readonly permittedReadUsers?: User[];
  readonly permittedUpdateUserGroups?: UserGroup[];
  readonly permittedUpdateUsers?: User[];

  readonly [key: string]: unknown;
}

/**
 * Value of a work item attribute.
 */
export interface WorkItemAttributeValue {
  readonly name?: string;

  readonly [key: string]: unknown;
}

/**
 * Work item attribute configured for the project.
 */
export interface WorkItemProjectAttribute {
  readonly name?: string;
  readonly values?: WorkItemAttributeValue[];

  findValueByName(name: unknown): void;
  readonly [key: string]: unknown;
}

/**
 * Represents a work type that can be assigned to a work item.
 */
export interface WorkItemType {
  readonly name?: string;

  readonly [key: string]: unknown;
}

/**
 * Represents an SLA paused interval with start and stop times
 */
export interface XdSlaPausedInterval {
  readonly start?: number;
  readonly stop?: number;

  readonly [key: string]: unknown;
}


// Static Method Interfaces


/**
 * Static methods for Agile
 */
export interface AgileConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findByName(name: unknown): void;
}

export declare const Agile: AgileConstructor;

/**
 * Static methods for Article
 */
export interface ArticleConstructor {
  action(ruleProperties: unknown): void;
  createDraft(project: unknown, author: unknown): void;
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findById(id: unknown): void;
  onChange(ruleProperties: unknown): void;
}

export declare const Article: ArticleConstructor;

/**
 * Static methods for ArticleAttachment
 */
export interface ArticleAttachmentConstructor {
  action(ruleProperties: unknown): void;
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const ArticleAttachment: ArticleAttachmentConstructor;

/**
 * Static methods for ArticleComment
 */
export interface ArticleCommentConstructor {
  action(ruleProperties: unknown): void;
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const ArticleComment: ArticleCommentConstructor;

/**
 * Static methods for Build
 */
export interface BuildConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const Build: BuildConstructor;

/**
 * Static methods for BundleProjectCustomField
 */
export interface BundleProjectCustomFieldConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const BundleProjectCustomField: BundleProjectCustomFieldConstructor;

/**
 * Static methods for Calendar24x7
 */
export interface Calendar24x7Constructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  instance(): void;
}

export declare const Calendar24x7: Calendar24x7Constructor;

/**
 * Static methods for EnumField
 */
export interface EnumFieldConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const EnumField: EnumFieldConstructor;

/**
 * Static methods for FeedbackForm
 */
export interface FeedbackFormConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const FeedbackForm: FeedbackFormConstructor;

/**
 * Static methods for Gantt
 */
export interface GanttConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findChartByName(name: unknown): void;
}

export declare const Gantt: GanttConstructor;

/**
 * Static methods for GroupProjectCustomField
 */
export interface GroupProjectCustomFieldConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const GroupProjectCustomField: GroupProjectCustomFieldConstructor;

/**
 * Static methods for Issue
 */
export interface IssueConstructor {
  action(ruleProperties: unknown): void;
  createDraft(project: unknown, reporter: unknown): void;
  createSharedDraft(project: unknown): void;
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findById(id: unknown): void;
  onChange(ruleProperties: unknown): void;
  onSchedule(ruleProperties: unknown): void;
  sla(ruleProperties: unknown): void;
  stateMachine(ruleProperties: unknown): void;
}

export declare const Issue: IssueConstructor;

/**
 * Static methods for IssueAttachment
 */
export interface IssueAttachmentConstructor {
  action(ruleProperties: unknown): void;
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const IssueAttachment: IssueAttachmentConstructor;

/**
 * Static methods for IssueComment
 */
export interface IssueCommentConstructor {
  action(ruleProperties: unknown): void;
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const IssueComment: IssueCommentConstructor;

/**
 * Static methods for IssueLinkPrototype
 */
export interface IssueLinkPrototypeConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findByName(name: unknown): void;
}

export declare const IssueLinkPrototype: IssueLinkPrototypeConstructor;

/**
 * Static methods for IssueTag
 */
export interface IssueTagConstructor {
  findByName(name: unknown): void;
  findTagByName(name: unknown): void;
}

export declare const IssueTag: IssueTagConstructor;

/**
 * Static methods for IssueWorkItem
 */
export interface IssueWorkItemConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const IssueWorkItem: IssueWorkItemConstructor;

/**
 * Static methods for MailboxChannel
 */
export interface MailboxChannelConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const MailboxChannel: MailboxChannelConstructor;

/**
 * Static methods for OwnedField
 */
export interface OwnedFieldConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const OwnedField: OwnedFieldConstructor;

/**
 * Static methods for PeriodProjectCustomField
 */
export interface PeriodProjectCustomFieldConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const PeriodProjectCustomField: PeriodProjectCustomFieldConstructor;

/**
 * Static methods for PersistentFile
 */
export interface PersistentFileConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const PersistentFile: PersistentFileConstructor;

/**
 * Static methods for Project
 */
export interface ProjectConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findByKey(key: unknown): void;
  findByName(name: unknown): void;
}

export declare const Project: ProjectConstructor;

/**
 * Static methods for ProjectTeam
 */
export interface ProjectTeamConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const ProjectTeam: ProjectTeamConstructor;

/**
 * Static methods for ProjectType
 */
export interface ProjectTypeConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const ProjectType: ProjectTypeConstructor;

/**
 * Static methods for ProjectVersion
 */
export interface ProjectVersionConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const ProjectVersion: ProjectVersionConstructor;

/**
 * Static methods for PullRequest
 */
export interface PullRequestConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const PullRequest: PullRequestConstructor;

/**
 * Static methods for PullRequestState
 */
export interface PullRequestStateConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const PullRequestState: PullRequestStateConstructor;

/**
 * Static methods for SavedQuery
 */
export interface SavedQueryConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findByName(name: unknown): void;
  findQueryByName(name: unknown): void;
}

export declare const SavedQuery: SavedQueryConstructor;

/**
 * Static methods for SimpleCalendar
 */
export interface SimpleCalendarConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const SimpleCalendar: SimpleCalendarConstructor;

/**
 * Static methods for SimpleProjectCustomField
 */
export interface SimpleProjectCustomFieldConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const SimpleProjectCustomField: SimpleProjectCustomFieldConstructor;

/**
 * Static methods for Sprint
 */
export interface SprintConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const Sprint: SprintConstructor;

/**
 * Static methods for State
 */
export interface StateConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const State: StateConstructor;

/**
 * Static methods for Tag
 */
export interface TagConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findByName(name: unknown, ignoreVisibilitySettings: unknown): void;
  findByOwner(owner: unknown): void;
  findTagByName(name: unknown): void;
}

export declare const Tag: TagConstructor;

/**
 * Static methods for TextProjectCustomField
 */
export interface TextProjectCustomFieldConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const TextProjectCustomField: TextProjectCustomFieldConstructor;

/**
 * Static methods for User
 */
export interface UserConstructor {
  findByEmail(email: unknown): void;
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findByLogin(login: unknown): void;
  findUniqueByEmail(email: unknown): void;
}

export declare const User: UserConstructor;

/**
 * Static methods for UserGroup
 */
export interface UserGroupConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findByName(name: unknown): void;
}

export declare const UserGroup: UserGroupConstructor;

/**
 * Static methods for UserProjectCustomField
 */
export interface UserProjectCustomFieldConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const UserProjectCustomField: UserProjectCustomFieldConstructor;

/**
 * Static methods for VcsChange
 */
export interface VcsChangeConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const VcsChange: VcsChangeConstructor;

/**
 * Static methods for WorkItemAttributeValue
 */
export interface WorkItemAttributeValueConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const WorkItemAttributeValue: WorkItemAttributeValueConstructor;

/**
 * Static methods for WorkItemProjectAttribute
 */
export interface WorkItemProjectAttributeConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const WorkItemProjectAttribute: WorkItemProjectAttributeConstructor;

/**
 * Static methods for WorkItemType
 */
export interface WorkItemTypeConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
  findByProject(project: unknown): void;
}

export declare const WorkItemType: WorkItemTypeConstructor;

/**
 * Static methods for XdSlaPausedInterval
 */
export interface XdSlaPausedIntervalConstructor {
  findByExtensionProperties(extensionPropertiesQuery: unknown): void;
}

export declare const XdSlaPausedInterval: XdSlaPausedIntervalConstructor;


// Type Aliases


export type AppGlobalStorage = BaseEntity;

export type Array<T = unknown> = globalThis.Array<T>;

export type Calendar = BaseEntity;

/**
 * Workflow context interface
 */
export interface WorkflowContext {
  readonly issue?: Issue;
  readonly currentUser?: User;
  readonly project?: Project;
  readonly [key: string]: unknown;
}

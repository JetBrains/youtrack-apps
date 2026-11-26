// Compile-only consumer coverage for the API additions used by the App Builder.
import {
  Article, ArticleAttachment, ArticleComment, Issue, IssueAttachment, IssueComment,
  ProjectVersion, State, User,
} from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';
import type {
  ActionPermissions, AppGlobalStorage, BaseArticle, BaseComment, BaseEntity, Calendar,
  Channel, FieldValue, PullRequestState, Set, UserGroup, UserInputSpec, WatchFolder,
  WorkItemProjectAttribute,
} from '@jetbrains/youtrack-workflow-types/workflowTypeScriptStubs';
import { licenseInfo } from '@jetbrains/youtrack-workflow-types/license';

declare const issue: Issue;
declare const article: Article;
declare const draft: BaseArticle;
declare const articleComment: ArticleComment;
declare const issueComment: IssueComment;
declare const baseComment: BaseComment;
declare const attachment: ArticleAttachment;
declare const user: User;
declare const group: UserGroup;

const mentions: Set<User>[] = [
  issue.mentionedUsers, article.mentionedUsers, draft.mentionedUsers,
  articleComment.mentionedUsers, issueComment.mentionedUsers, baseComment.mentionedUsers,
];
const comments: Set<ArticleComment>[] = [draft.comments, draft.pinnedComments];
const commentOwner: BaseArticle = articleComment.article;
const instanceId: string = licenseInfo.instanceId;
const hasGlobalRole: boolean = user.hasRoleGlobally('Project Admin');

attachment.permittedGroups.add(group);
attachment.permittedUsers.add(user);

const versionInput = {
  type: ProjectVersion,
  description: 'Select target version',
  field: 'Fix versions',
  project: 'DEMO',
} satisfies UserInputSpec;

Issue.action({ userInput: versionInput, permissions: ['READ_ISSUE', 'UPDATE_ISSUE'] });
Issue.action({ permissions: { anyOf: ['READ_ISSUE', 'UPDATE_ISSUE'] } });
Issue.action({ permissions: { allOf: ['READ_ISSUE', 'UPDATE_ISSUE'] } });
Article.action({ userInput: versionInput });
ArticleAttachment.action({ userInput: versionInput });
ArticleComment.action({ userInput: { type: User, group: 'Reviewers' } });
IssueAttachment.action({ userInput: { type: State, field: 'State' } });
IssueComment.action({ userInput: versionInput });

const history: FieldValue | Set<FieldValue> = issue.oldValue('tags');
const previousUsers: typeof history = issue.mentionedUsers;

const comparableEntities: Pick<Issue, 'becomes' | 'was' | 'isChanged' | 'oldValue'>[] = [
  issue, article, draft, articleComment, issueComment, baseComment, attachment, user,
];

declare const watchFolder: WatchFolder;
declare const workItemAttribute: WorkItemProjectAttribute;
watchFolder.isChanged('issues');
watchFolder.oldValue('issues');
workItemAttribute.isChanged('values');
workItemAttribute.oldValue('values');
// @ts-expect-error WatchFolder supports collection history, not value comparison.
watchFolder.becomes('issues', issue);
// @ts-expect-error WatchFolder supports collection history, not value comparison.
watchFolder.was('issues', issue);
// @ts-expect-error WorkItemProjectAttribute supports collection history, not value comparison.
workItemAttribute.becomes('values', 'previous');
// @ts-expect-error WorkItemProjectAttribute supports collection history, not value comparison.
workItemAttribute.was('values', 'previous');

declare const genericEntity: BaseEntity;
genericEntity.is('name', 'example');
genericEntity.required('name', 'Name is required');
// @ts-expect-error BaseEntity does not promise value comparison.
genericEntity.becomes('name', 'example');
// @ts-expect-error BaseEntity does not promise value comparison.
genericEntity.was('name', 'example');
// @ts-expect-error BaseEntity does not promise transaction history.
genericEntity.isChanged('name');
// @ts-expect-error BaseEntity does not promise transaction history.
genericEntity.oldValue('name');

type AssertNever<T extends never> = T;
type UnsupportedTracking = AssertNever<Extract<
  keyof AppGlobalStorage | keyof Calendar | keyof Channel | keyof PullRequestState,
  'becomes' | 'was' | 'isChanged' | 'oldValue'
>>;
declare const unsupportedTracking: UnsupportedTracking;

// @ts-expect-error The permission object must select one combination mode.
const mixedPermissions: ActionPermissions = { anyOf: ['READ_ISSUE'], allOf: ['UPDATE_ISSUE'] };
Issue.action({
  // @ts-expect-error An empty object does not select a permission combination mode.
  permissions: {},
});
Issue.action({
  userInput: {
    type: User,
    // @ts-expect-error User input filters use names, not entity objects.
    group,
  },
});
// @ts-expect-error An article comment can belong to a draft, which is not an Article.
const publishedArticle: Article = articleComment.article;
// @ts-expect-error The mentionedUsers property is readonly.
issue.mentionedUsers = issueComment.mentionedUsers;

void [
  mentions, comments, commentOwner, instanceId, hasGlobalRole, history, previousUsers,
  comparableEntities, unsupportedTracking, mixedPermissions, publishedArticle,
];

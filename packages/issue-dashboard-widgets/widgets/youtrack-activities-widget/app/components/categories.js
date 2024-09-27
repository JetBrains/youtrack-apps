import {i18n} from 'hub-dashboard-addons/dist/localization';

export const CATEGORIES = [
  {id: 'IssueCreatedCategory', name: i18n('New issues'), default: true},
  {id: 'IssueResolvedCategory', name: i18n('Resolved/reopened issues')},
  {id: 'IssueRestoredCategory,IssueDeletedCategory', name: i18n('Deleted/Restored issues')},
  {id: 'ProjectCategory', name: i18n('Project'), default: true},
  {id: 'SummaryCategory', name: i18n('Summary'), default: true},
  {id: 'DescriptionCategory', name: i18n('Description'), default: true},
  {id: 'CustomFieldCategory', name: i18n('Custom fields'), default: true},
  {id: 'AttachmentsCategory', name: i18n('Attachments'), default: true},
  {id: 'LinksCategory', name: i18n('Links'), default: true},
  {id: 'CommentsCategory', name: i18n('Comments'), default: true},
  {id: 'TagsCategory', name: i18n('Tags')},
  {id: 'SprintCategory', name: i18n('Sprints')},
  {id: 'WorkItemCategory', name: i18n('Work items')},
  {id: 'VcsChangeCategory', name: i18n('VCS changes')}
];

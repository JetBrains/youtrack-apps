const QUERY_ASSIST_FIELDS = 'query,caret,styleRanges(start,length,style),suggestions(options,prefix,option,suffix,description,matchingStart,matchingEnd,caret,completionStart,completionEnd,group,icon)';
const GENERAL_PROFILE_FIELDS = 'dateFieldFormat(datePattern,pattern)';

const PROJECT_CUSTOM_FIELD_FIELDS = 'id,bundle(id),field(id,name,localizedName,fieldType(id,valueType))';
const ISSUE_FIELD_VALUE_FIELDS = 'id,name,localizedName,login,avatarUrl,name,presentation,minutes,color(id,foreground,background)';
const ISSUE_FIELD_FIELDS = `id,value(${ISSUE_FIELD_VALUE_FIELDS}),projectCustomField(${PROJECT_CUSTOM_FIELD_FIELDS})`;
const ISSUE_FIELDS = `id,idReadable,summary,resolved,fields(${ISSUE_FIELD_FIELDS})`;

export async function loadIssue(fetchYouTrack, id) {
  return await fetchYouTrack(`api/issues/${id}?fields=${ISSUE_FIELDS}`);
}

export async function underlineAndSuggest(fetchYouTrack, query, caret, folder) {
  return await fetchYouTrack(`api/search/assist?fields=${QUERY_ASSIST_FIELDS}`, {
    method: 'POST',
    body: {query, caret, folder}
  });
}

export async function queryUsers(fetchHub, query) {
  return fetchHub('api/rest/users', {
    query: {
      query,
      fields: 'id,name,profile(avatar(url))',
      orderBy: 'login',
      $top: 10
    }
  });
}

export async function loadMeProfile(fetchYouTrack) {
  const path = 'api/users/me/profiles/general';
  return await fetchYouTrack(`${path}?fields=${GENERAL_PROFILE_FIELDS}`);
}

export async function loadConfigL10n(fetchYouTrack) {
  return fetchYouTrack('api/config', {
    query: {
      fields: 'l10n(predefinedQueries)'
    }
  });
}

const ISSUE = 'id,idReadable,summary,resolved';
const AUTHOR = 'author(id,login,email,fullName,avatarUrl,ringId,isLocked)';
const CHANGED_VALUES = [
  'id,name',
  'text',
  'urls',
  'version',
  'project(shortName),numberInProject',
  'agile(id,name)',
  'date',
  'url',
  'mimeType',
  'thumbnailURL',
  'type(name)',
  'duration(presentation,updated,minutes)',
  AUTHOR,
  ISSUE
];
const CHANGE = CHANGED_VALUES.join(',');
const ADD = `added(${CHANGE})`;
const REM = `removed(${CHANGE})`;
const TARGET = `target(${ISSUE},issue(${ISSUE}))`;
const FIELD = 'field(presentation,customField(name,fieldType(valueType,isMultiValue)))';
const CONTAINER = 'container(id,trimmedDescription)';
const ASSISTANT = `assistantActivities(id,${FIELD},added(id,name),removed(id,name))`;
// eslint-disable-next-line max-len
const ACTIVITIES_FIELDS = `id,timestamp,category(id),emptyFieldText,${TARGET},${AUTHOR},${ADD},${REM},${FIELD},${CONTAINER},${ASSISTANT}`;
// eslint-disable-next-line max-len
const ALL_CATEGORIES = 'CommentsCategory,AttachmentsCategory,AttachmentRenameCategory,CustomFieldCategory,DescriptionCategory,IssueCreatedCategory,IssueResolvedCategory,IssueDeletedCategory,IssueRestoredCategory,LinksCategory,ProjectCategory,IssueVisibilityCategory,SprintCategory,SummaryCategory,TagsCategory,VcsChangeCategory';

export async function loadActivities(fetchYouTrack, params) {
  const packSize = 50;
  const skipSize = 0; //TODO implement paging
  const categories = params.categoriesIds && params.categoriesIds.join(',');
  const queryParams = [
    `fields=${ACTIVITIES_FIELDS}`,
    `categories=${categories || ALL_CATEGORIES}`,
    `$top=${packSize}`,
    `$skip=${skipSize}`,
    'reverse=true',
    'effective=true',
    'imported=false',
    params.author && `author=${params.author.id}`,
    params.query && `issueQuery=${encodeURIComponent(params.query)}`,
    params.start && `start=${params.start}`,
    params.end && `end=${params.end}`
  ];
  const queryParamsStr = queryParams.filter(p => !!p).join('&');
  return await fetchYouTrack(`api/activities?${queryParamsStr}`);
}

const ACTIVITIES_FIELDS_PAGE = `beforeCursor,hasBefore,afterCursor,hasAfter,activities(${ACTIVITIES_FIELDS})`;

function getQueryParams(categories, packSize, params) {
  return [
    `fields=${ACTIVITIES_FIELDS_PAGE}`,
    `categories=${categories || ALL_CATEGORIES}`,
    `$top=${packSize}`,
    'reverse=true',
    'effective=true',
    'imported=false',
    params.cursor && `cursor=${encodeURIComponent(params.cursor)}`,
    params.author && `author=${params.author.id}`,
    params.query && `issueQuery=${encodeURIComponent(params.query)}`,
    params.start && `start=${params.start}`,
    params.end && `end=${params.end}`
  ];
}

export async function loadActivitiesPage(fetchYouTrack, params) {
  const packSize = 50;
  const categories = params.categoriesIds && params.categoriesIds.join(',');
  const queryParams = getQueryParams(categories, packSize, params);
  const queryParamsStr = queryParams.filter(p => !!p).join('&');
  return await fetchYouTrack(`api/activitiesPage?${queryParamsStr}`);
}

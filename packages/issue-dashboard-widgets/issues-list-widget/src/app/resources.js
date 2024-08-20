const PROJECT_CUSTOM_FIELD_FIELDS = 'id,bundle(id),field(id,name,localizedName,fieldType(id,valueType))';
const ISSUE_FIELD_VALUE_FIELDS = 'id,name,localizedName,login,avatarUrl,name,presentation,minutes,color(id,foreground,background)';
const ISSUE_FIELD_FIELDS = `id,value(${ISSUE_FIELD_VALUE_FIELDS}),projectCustomField(${PROJECT_CUSTOM_FIELD_FIELDS})`;
const ISSUE_FIELDS = `id,idReadable,summary,resolved,fields(${ISSUE_FIELD_FIELDS})`;
const NODES_FIELDS = 'tree(id,ordered)';

const QUERY_ASSIST_FIELDS = 'query,caret,styleRanges(start,length,style),suggestions(options,prefix,option,suffix,description,matchingStart,matchingEnd,caret,completionStart,completionEnd,group,icon)';
const WATCH_FOLDERS_FIELDS = 'id,$type,name,query,shortName';

const DATE_PRESENTATION_SETTINGS = 'id,dateFieldFormat(pattern,datePattern)';

export const ISSUES_PACK_SIZE = 50;

// eslint-disable-next-line complexity
export async function loadIssues(fetchYouTrack, query, context, skip) {
  const encodedQuery = encodeURIComponent(query);
  if (context && context.id) {
    return await fetchYouTrack(
      `api/issueFolders/${context.id}/sortOrder/issues?fields=${ISSUE_FIELDS}&query=${encodedQuery}&$top=${ISSUES_PACK_SIZE}&$skip=${skip || 0}`
    );
  }

  const sortedNodes = await fetchYouTrack(
    `api/sortedIssues?fields=${NODES_FIELDS}&query=${encodedQuery}&topRoot=${ISSUES_PACK_SIZE}&skipRoot=${skip || 0}&flatten=true`
  );
  return await fetchYouTrack(
    `api/issuesGetter?$top=-1&fields=${ISSUE_FIELDS}`, {
      method: 'POST',
      body: (sortedNodes.tree || []).map(node => ({id: node.id}))
    }
  );
}

export async function loadTotalIssuesCount(
  fetchYouTrack, issue, query, context
) {
  const searchPage = await fetchYouTrack(
    'api/issuesGetter/count?fields=count', {
      method: 'POST',
      body: {
        folder: context && context.id && {
          $type: context.$type,
          id: context.id
        } || null,
        query: query || null
      }
    }
  );
  return searchPage && searchPage.count;
}

export async function loadPinnedIssueFolders(fetchYouTrack, loadAll) {
  const packSize = 100;
  return await fetchYouTrack(`api/userIssueFolders?fields=${WATCH_FOLDERS_FIELDS}&$top=${loadAll ? -1 : packSize}`);
}

export async function loadDateFormats(fetchYouTrack) {
  const generalUserProfile = await fetchYouTrack(`api/users/me/profiles/general?fields=${DATE_PRESENTATION_SETTINGS}`);
  const dateFormats =
    (generalUserProfile && generalUserProfile.dateFieldFormat) || {};
  return {
    datePattern: toFechaFormat(dateFormats.datePattern),
    dateTimePattern: toFechaFormat(dateFormats.pattern)
  };

  function toFechaFormat(pattern) {
    return (pattern || '').replace(/y/g, 'Y').replace(/d/g, 'D').replace('aaa', 'A');
  }
}

export async function underlineAndSuggest(fetchYouTrack, query, caret, folder) {
  return await fetchYouTrack(`api/search/assist?fields=${QUERY_ASSIST_FIELDS}`, {
    method: 'POST',
    body: {query, caret, folder}
  });
}

import ServiceResources from '@jetbrains/hub-widget-ui/dist/service-resources';

import {getCurrentSprint} from '../agile-board-model/agile-board-model';
import BackendTypes from '../backend-types/backend-types';

const REQUESTED_YOUTRACK_VERSION = '2020.1.3111';

const PERMISSION_FIELDS = 'permission,key,global,projects(id)';

const USER_FIELDS = 'id,ringId,login,name,avatarUrl,avatar(url),email,banned,online';
const USER_GROUP_FIELDS = 'id,ringId,name,icon';
const PROJECTS_FIELDS = 'id,name,shortName,template,archived';

const ISSUE_FIELD_VALUE_FIELDS = '$type,id,name,localizedName,fullName,minutes,text,markdownText,presentation,color(id)';
const ISSUE_FIELD_FIELDS = `id,name,value(${ISSUE_FIELD_VALUE_FIELDS}),projectCustomField(id,field(id,name,fieldType(valueType)),emptyFieldText)`;
const ISSUE_FIELDS = `id,idReadable,summary,fields(${ISSUE_FIELD_FIELDS})`;

const WORK_ITEM_TYPE_FIELDS = 'id,name';
const REPORT_FILTER_FIELDS_FIELDS = 'id,name,presentation,localizedName,customField(fieldType(presentation))';

const REPORT_BASE_FIELDS = `id,name,owner(${USER_FIELDS}),pinned,own,editable`;

const SHARING_SETTINGS_FIELDS = `permittedGroups(${USER_GROUP_FIELDS}),permittedUsers(${USER_FIELDS})`;

const Y_AXIS_TYPE_FIELDS = 'yaxisType(id,name)';
const BURN_DOWN_REPORT_POINT_FIELDS = 'time,value';
const BURNDOWN_REPORT_DATA_FIELDS = `xlabel,ylabel,sprintFinish,remainingEffortPresentation,ideal(${BURN_DOWN_REPORT_POINT_FIELDS}),remainingEstimation(${BURN_DOWN_REPORT_POINT_FIELDS}),cumulativeSpentTime(${BURN_DOWN_REPORT_POINT_FIELDS}),${Y_AXIS_TYPE_FIELDS}`;

const PERIOD_FIELD_VALUE_FIELDS = 'value,presentation';
const REPORT_STATUS_FIELDS = 'id,calculationInProgress,progress,error,errorMessage,isOutdated';

const TIME_SHEET_REPORT_LINE_DATA = `id,entityId,presentation,avatarUrl,spentTime(${PERIOD_FIELD_VALUE_FIELDS}),estimation(${PERIOD_FIELD_VALUE_FIELDS}),cells(${PERIOD_FIELD_VALUE_FIELDS}),totalSpentTime(${PERIOD_FIELD_VALUE_FIELDS})`;
const TIME_REPORT_LINE_DATA = `id,issueId,userId,userVisibleName,description,avatarUrl,duration(${PERIOD_FIELD_VALUE_FIELDS}),totalDuration(${PERIOD_FIELD_VALUE_FIELDS}),estimation(${PERIOD_FIELD_VALUE_FIELDS}),cells(${PERIOD_FIELD_VALUE_FIELDS}),typeDurations(duration(${PERIOD_FIELD_VALUE_FIELDS}),workType)`;
const TIME_SHEET_GROUP_DATA_FIELDS = `name,meta(linkedIssue(idReadable,summary),linkedUser(ringId,visibleName)),entityId,lineSpentTime(${PERIOD_FIELD_VALUE_FIELDS}),spentTime(${PERIOD_FIELD_VALUE_FIELDS}),estimation(${PERIOD_FIELD_VALUE_FIELDS}),issueLines(${TIME_SHEET_REPORT_LINE_DATA}),userLines(${TIME_SHEET_REPORT_LINE_DATA})`;
const TIME_GROUP_DATA_FIELDS = `name,meta(linkedIssue(idReadable,summary),linkedUser(ringId,visibleName)),entityId,typeDurations(duration(${PERIOD_FIELD_VALUE_FIELDS}),workType),spentTime(${PERIOD_FIELD_VALUE_FIELDS}),estimation(${PERIOD_FIELD_VALUE_FIELDS}),duration(${PERIOD_FIELD_VALUE_FIELDS}),totalDuration(${PERIOD_FIELD_VALUE_FIELDS}),lines(${TIME_REPORT_LINE_DATA})`;
const GROUP_DATA_FIELDS = `${TIME_SHEET_GROUP_DATA_FIELDS},${TIME_GROUP_DATA_FIELDS}`;
const TIME_REPORT_DATA_FIELDS = `duration(${PERIOD_FIELD_VALUE_FIELDS}),typeDurations(workType,duration(${PERIOD_FIELD_VALUE_FIELDS})),groups(${GROUP_DATA_FIELDS})`;
const TIME_SHEET_REPORT_DATA_FIELDS = `hasIssueView,headers(start,end,holiday,spentTime(${PERIOD_FIELD_VALUE_FIELDS})),spentTime(${PERIOD_FIELD_VALUE_FIELDS}),groups(${GROUP_DATA_FIELDS})`;
const TIME_TRACKING_REPORT_DATA_FIELDS = `${TIME_SHEET_REPORT_DATA_FIELDS},${TIME_REPORT_DATA_FIELDS}`;

const ISSUE_DISTRIBUTION_REPORT_DATA_COLUMN_FIELDS = `id,name,size(value,presentation),naturalSortIndex,index,user(${USER_FIELDS}),issue(id,idReadable,resolved,summary),colorIndex(id,foreground,background),issuesQuery,queryUrl`;
const ISSUE_DISTRIBUTION_REPORT_DATA_FIELDS = [
  'tooBig',
  'total(value,presentation)',
  'counts(value,presentation)',
  'issuesQueries',
  `columns(${ISSUE_DISTRIBUTION_REPORT_DATA_COLUMN_FIELDS})`,
  `xcolumns(${ISSUE_DISTRIBUTION_REPORT_DATA_COLUMN_FIELDS})`,
  `ycolumns(${ISSUE_DISTRIBUTION_REPORT_DATA_COLUMN_FIELDS})`
].join(',');

const REPORT_ITEM_VALUE_FIELDS = 'value,presentation';
const CUMULATIVE_FLOW_REPORT_DATA_FIELDS = `xlabel,ylabel,sample(date,values(${REPORT_ITEM_VALUE_FIELDS})),names,colors,${Y_AXIS_TYPE_FIELDS}`;
const REPORT_SPRINT_SHORT_FIELDS = 'id,name,agile(id,name,sprintsSettings(disableSprints))';
const REPORT_WITH_DATA_FIELDS = `${REPORT_BASE_FIELDS},data(${TIME_SHEET_REPORT_DATA_FIELDS},${TIME_REPORT_DATA_FIELDS},${BURNDOWN_REPORT_DATA_FIELDS},${CUMULATIVE_FLOW_REPORT_DATA_FIELDS}),sprint(${REPORT_SPRINT_SHORT_FIELDS}),status(${REPORT_STATUS_FIELDS})`;

const TIME_TRACKING_REPORT_SETTINGS_FIELDS = `grouping(id,field(${REPORT_FILTER_FIELDS_FIELDS})),scale(id),projects(${PROJECTS_FIELDS}),authors(${USER_FIELDS}),users(${USER_FIELDS}),workTypes(${WORK_ITEM_TYPE_FIELDS}),range($type,id,range($type,id),from,to)`;
const ISSUE_DISTRIBUTION_REPORT_SETTINGS_FIELDS = [
  `xaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS}))`,
  `yaxis(id,field(${REPORT_FILTER_FIELDS_FIELDS}))`,
  `aggregationPolicy(id,field(${REPORT_FILTER_FIELDS_FIELDS}))`,
  'xsortOrder',
  'ysortOrder',
  'presentation',
  `customField(${REPORT_FILTER_FIELDS_FIELDS})`
].join(',');
const REPORT_WITH_SETTINGS_FIELDS = `${REPORT_BASE_FIELDS},projects(${PROJECTS_FIELDS}),query,own,readSharingSettings(${SHARING_SETTINGS_FIELDS}),updateSharingSettings(${SHARING_SETTINGS_FIELDS})`;
const TIME_TRACKING_REPORT_WITH_SETTINGS_FIELDS = `${REPORT_WITH_SETTINGS_FIELDS},${TIME_TRACKING_REPORT_SETTINGS_FIELDS}`;
const ISSUE_DISTRIBUTION_REPORT_WITH_SETTINGS_FIELDS = `${REPORT_WITH_SETTINGS_FIELDS},${ISSUE_DISTRIBUTION_REPORT_SETTINGS_FIELDS}`;

const QUERY_ASSIST_FIELDS = 'query,caret,styleRanges(start,length,style),suggestions(options,prefix,option,suffix,description,matchingStart,matchingEnd,caret,completionStart,completionEnd,group,icon)';

const SPRINT_FIELDS = 'id,name,start,finish,report(id)';
const AGILE_FIELDS = `id,name,sprints(${SPRINT_FIELDS}),currentSprint(${SPRINT_FIELDS}),sprintsSettings(disableSprints,explicitQuery),columnSettings(field(id,name)),owner(id,ringId,fullName),projects(id,template,archived)`;
const AGILE_REPORT_SETTINGS_FIELDS = 'extensions(reportSettings(doNotUseBurndown))';

async function underlineAndSuggest(fetchYouTrack, query, caret) {
  return await fetchYouTrack(`api/search/assist?fields=${QUERY_ASSIST_FIELDS}`, {
    method: 'POST',
    body: {query, caret}
  });
}

async function loadProjects(fetchYouTrack) {
  const projects = await fetchYouTrack(`api/admin/projects?fields=${PROJECTS_FIELDS}&$top=-1`);
  return (projects || []).filter(
    project => !project.template && !project.archived
  );
}

async function loadReportProjects(fetchYouTrack, fetchHub, report) {
  if (report.id) {
    return await fetchYouTrack(`api/reports/${report.id}/accessibleProjects?fields=${PROJECTS_FIELDS}&$top=-1`);
  }
  const projects = await loadProjects(fetchYouTrack);
  const permissionCache = await fetchHub(
    `api/rest/permissions/cache?fields=${PERMISSION_FIELDS}`
  );
  const createReportPermission = permissionCache.find(it =>
    it.permission.key === 'JetBrains.YouTrack.CREATE_REPORT');
  if (!createReportPermission || createReportPermission.global) {
    return projects;
  }
  const projectIds = createReportPermission.projects.map(it => it.id);
  return projects.filter(it => projectIds.indexOf(it.ringId) >= 0);
}

async function loadAgiles(fetchYouTrack) {
  const agiles = await fetchYouTrack(`api/agiles?fields=${AGILE_FIELDS}&$top=-1`);
  return (agiles || []).filter(
    ({projects}) =>
      projects.some(project => !project.template && !project.archived)
  );
}

async function loadAgileReportSettings(fetchYouTrack, agileId) {
  const agileSettings = await fetchYouTrack(`api/agiles/${agileId}?fields=${AGILE_REPORT_SETTINGS_FIELDS}&$top=-1`);
  return agileSettings && agileSettings.extensions &&
    agileSettings.extensions.reportSettings;
}

async function loadSprint(fetchYouTrack, agileId, sprintId) {
  if (sprintId) {
    return await fetchYouTrack(`api/agiles/${agileId}/sprints/${sprintId}?fields=${SPRINT_FIELDS}`);
  }
  const agile = await fetchYouTrack(`api/agiles/${agileId}?fields=${AGILE_FIELDS}`);
  return getCurrentSprint(agile);
}

async function loadReportWithData(
  fetchYouTrack, reportId, params, fields = REPORT_WITH_DATA_FIELDS
) {
  const lineParam = params && params.line ? `&line=${params.line}` : '';
  return await fetchYouTrack(
    `api/reports/${reportId}?fields=${fields}${lineParam}`
  );
}

async function loadTimeTrackingReportWithData(
  fetchYouTrack, reportId, params
) {
  const fields = `${TIME_TRACKING_REPORT_WITH_SETTINGS_FIELDS},data(${TIME_TRACKING_REPORT_DATA_FIELDS}),status(${REPORT_STATUS_FIELDS})`;
  return await loadReportWithData(
    fetchYouTrack, reportId, params, fields
  );
}

async function loadIssueDistributionReportWithData(
  fetchYouTrack, reportId, params
) {
  const fields = `${ISSUE_DISTRIBUTION_REPORT_WITH_SETTINGS_FIELDS},data(${ISSUE_DISTRIBUTION_REPORT_DATA_FIELDS}),status(${REPORT_STATUS_FIELDS})`;
  return await loadReportWithData(
    fetchYouTrack, reportId, params, fields
  );
}


async function loadReportWithSettings(
  fetchYouTrack, reportId, fields = REPORT_WITH_SETTINGS_FIELDS
) {
  return await fetchYouTrack(
    `api/reports/${reportId}?fields=${fields}`
  );
}

async function loadTimeTrackingReportWithSettings(
  fetchYouTrack, reportId
) {
  return await loadReportWithSettings(
    fetchYouTrack, reportId, TIME_TRACKING_REPORT_WITH_SETTINGS_FIELDS
  );
}

async function loadIssueDistributionReportWithSettings(
  fetchYouTrack, reportId
) {
  return await loadReportWithSettings(
    fetchYouTrack, reportId, ISSUE_DISTRIBUTION_REPORT_WITH_SETTINGS_FIELDS
  );
}

async function loadReportsList(fetchYouTrack, reportTypes = []) {
  const typesParameter = reportTypes.map(BackendTypes.toShortType).join(',');

  return (
    await fetchYouTrack(`api/reports?fields=${REPORT_BASE_FIELDS}&$top=300&types=${typesParameter}`)
  ) || [];
}

async function loadIndependentBurnDownReports(fetchYouTrack) {
  return await loadReportsList(
    fetchYouTrack, [BackendTypes.get().IndependentBurndownReport]
  );
}

async function loadIssuesDistributionReports(fetchYouTrack) {
  const distributionReportTypes = [
    BackendTypes.get().IssuePerProjectReport,
    BackendTypes.get().IssuePerAssigneeReport,
    BackendTypes.get().FlatDistributionReport,
    BackendTypes.get().MatrixReport
  ];

  return await loadReportsList(fetchYouTrack, distributionReportTypes);
}

async function loadTimeReports(fetchYouTrack) {
  const timeReportTypes = [
    BackendTypes.get().TimeReport,
    BackendTypes.get().TimeSheetReport
  ];
  return await loadReportsList(fetchYouTrack, timeReportTypes);
}

async function loadReportsGroupingFilterFields(fetchYouTrack, projects) {
  const fld = serializeArrayParameter('fld',
    (projects || []).map(project => project.id)
  );
  const groupingFieldsTypes = [
    'version[1]',
    'ownedField[1]',
    'state[1]',
    'user[1]',
    'enum[1]',
    'build[1]',
    'date',
    'integer',
    'float',
    'period',
    'project',
    'string'
  ];
  const fieldTypes = serializeArrayParameter('fieldTypes', groupingFieldsTypes);
  const params = [
    fld,
    '$top=300',
    `fields=${REPORT_FILTER_FIELDS_FIELDS}`,
    fieldTypes,
    'getUnusedVisibleFields=true'
  ].filter(param => param.length > 0).join('&');

  return await fetchYouTrack(`api/filterFields?${params}`);
}

async function loadReportsAggregationFilterFields(fetchYouTrack, projects) {
  const fieldTypes = serializeArrayParameter(
    'fieldTypes', ['integer', 'float', 'period']
  );
  const fld = serializeArrayParameter('fld',
    (projects || []).map(project => project.id)
  );
  const params = [
    fieldTypes,
    fld,
    'includeNonFilterFields=true',
    '$top=300',
    'usage=true',
    `fields=${REPORT_FILTER_FIELDS_FIELDS}`
  ].filter(param => param.length > 0).join('&');

  const aggregationFilterFields = (await fetchYouTrack(`api/filterFields?${params}`)) || [];

  const configWithVotesPresentations = await fetchYouTrack('api/config?fields=l10n(predefinedQueries(votes))');
  const votersPresentation = configWithVotesPresentations &&
    configWithVotesPresentations.l10n &&
    configWithVotesPresentations.l10n.predefinedQueries &&
    configWithVotesPresentations.l10n.predefinedQueries.votes;

  if (votersPresentation) {
    return [{
      presentation: votersPresentation,
      id: votersPresentation,
      $type: BackendTypes.get().PredefinedFilterField
    }].concat(aggregationFilterFields);
  }
  return aggregationFilterFields;
}

function serializeArrayParameter(paramName, arr) {
  return encodeURI(
    arr.map(item => `${paramName}=${item}`).join('&')
  );
}

async function saveReportSettings(
  fetchYouTrack, report, isFullReportWithDataResponse
) {
  const reportIdPart = report.id ? `/${report.id}` : '';
  const fields = isFullReportWithDataResponse
    ? REPORT_WITH_DATA_FIELDS
    : REPORT_BASE_FIELDS;
  return await fetchYouTrack(`api/reports${reportIdPart}?fields=${fields}`, {
    method: 'POST',
    body: report
  });
}

async function recalculateReport(fetchYouTrack, report) {
  return await fetchYouTrack(`api/reports/${report.id}/status?fields=calculationInProgress,progress`, {
    method: 'POST',
    body: {
      calculationInProgress: true
    }
  });
}

async function loadUserGroups(fetchYouTrack) {
  return await fetchYouTrack(
    `api/groups?fields=${USER_GROUP_FIELDS}`
  );
}

async function loadVisibilityUserGroups(fetchYouTrack, {query}) {
  const result = await fetchYouTrack(
    `api/visibilityGroups?fields=visibilityGroups(${USER_GROUP_FIELDS})`, {
      method: 'POST',
      body: {prefix: query}
    }
  );
  return (result || {}).visibilityGroups || [];
}

async function loadCurrentUser(fetchHub) {
  return await loadUser(fetchHub);
}

async function loadUserGeneralProfile(fetchYouTrack, userId = 'me') {
  const EXTENDED_USER_FIELDS = 'dateFieldFormat(datePattern,dateNoYearPattern)';

  return await fetchYouTrack(
    `api/users/${userId}/profiles/general?fields=${EXTENDED_USER_FIELDS}`
  );
}

async function loadUser(fetchHub, ringId = 'me', fields = USER_FIELDS) {
  return await fetchHub(
    `api/rest/users/${ringId}?fields=${fields}`
  );
}

async function loadUsers(
  fetchYouTrack,
  {permission, projectIds, query, $skip = 0}
) {
  const queryParams = {$skip, $top: 20, permission, query};
  if (projectIds && projectIds.length) {
    queryParams.projectId = projectIds.map(
      projectId => `projectId=${projectId}`
    ).join('&');
  }
  return await fetchYouTrack(
    `api/users?fields=${USER_FIELDS}`, {
      query: queryParams
    }
  );
}

async function loadIssue(fetchYoutrack, issueId) {
  return await fetchYoutrack(
    `api/issues/${issueId}?fields=${ISSUE_FIELDS}`
  );
}

async function loadWorkItemTypes(fetchYouTrack) {
  return await fetchYouTrack(
    `api/admin/timeTrackingSettings/workItemTypes?fields=${WORK_ITEM_TYPE_FIELDS}&top=-1`, {}
  );
}

async function getYouTrackServices(dashboardApi) {
  return ServiceResources.getYouTrackServices(
    dashboardApi, REQUESTED_YOUTRACK_VERSION
  );
}

async function getYouTrackService(dashboardApi, optionalYtId) {
  let services = await getYouTrackServices(dashboardApi);
  if (optionalYtId) {
    services = services.filter(service => service.id === optionalYtId);
  }
  return services[0];
}

function makeYouTrackFetcher(dashboardApi, youTrack) {
  return async (url, params) =>
    await dashboardApi.fetch(youTrack.id, url, params);
}

export {
  loadReportWithData,
  loadReportsList,
  loadIndependentBurnDownReports,
  loadIssuesDistributionReports,
  loadTimeReports,
  loadReportWithSettings,
  loadTimeTrackingReportWithSettings,
  loadIssueDistributionReportWithSettings,
  loadReportsAggregationFilterFields,
  loadReportsGroupingFilterFields,
  loadTimeTrackingReportWithData,
  loadIssueDistributionReportWithData,
  saveReportSettings,
  recalculateReport,
  getYouTrackServices,
  getYouTrackService,
  underlineAndSuggest,
  loadProjects,
  loadReportProjects,
  loadVisibilityUserGroups,
  loadAgiles,
  loadAgileReportSettings,
  loadSprint,
  loadUserGroups,
  loadCurrentUser,
  loadUserGeneralProfile,
  loadUser,
  loadUsers,
  loadIssue,

  loadWorkItemTypes,

  makeYouTrackFetcher
};

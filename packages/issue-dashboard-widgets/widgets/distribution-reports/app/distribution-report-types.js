import {i18n} from 'hub-dashboard-addons/dist/localization';

import BackendTypes from '../../../../lib/reporting-components/backend-types/backend-types';

const getReportTypesMap = () => ({
  [BackendTypes.get().IssuePerProjectReport]: {
    id: BackendTypes.get().IssuePerProjectReport,
    pathPrefix: 'issuesPerProject',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/Issues-per-Project.html'
  },
  [BackendTypes.get().IssuePerAssigneeReport]: {
    id: BackendTypes.get().IssuePerAssigneeReport,
    pathPrefix: 'issuesPerAssignee',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/Issues-per-Assignee.html'
  },
  [BackendTypes.get().FlatDistributionReport]: {
    id: BackendTypes.get().FlatDistributionReport,
    pathPrefix: 'flatDistribution',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/Issues-per-Arbitrary-Field.html'
  },
  [BackendTypes.get().MatrixReport]: {
    id: BackendTypes.get().MatrixReport,
    pathPrefix: 'issueDistribution',
    docs: 'https://www.jetbrains.com/help/youtrack/standalone/Issues-per-Arbitrary-Field.html'
  }
});


function getReportTypePresentation(report) {
  if (report.$type === BackendTypes.get().IssuePerProjectReport) {
    return i18n('Project');
  }
  if (report.$type === BackendTypes.get().IssuePerAssigneeReport) {
    return i18n('Assignee');
  }
  const ordinateForPresentation = report.yaxis || report.xaxis;
  return (
    ordinateForPresentation && ordinateForPresentation.field &&
      ordinateForPresentation.field.presentation
  ) || '';
}

function isTypeWithEditableXAxis(report) {
  return BackendTypes.entityOfType(report, [
    BackendTypes.get().FlatDistributionReport,
    BackendTypes.get().MatrixReport
  ]);
}

function getReportTypePathPrefix(report) {
  const reportTypeData = getReportTypesMap()[report && report.$type];
  return reportTypeData && reportTypeData.pathPrefix;
}


export {
  getReportTypePathPrefix,
  getReportTypePresentation,
  isTypeWithEditableXAxis
};

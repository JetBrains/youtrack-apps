import ReportModel from '../../../../lib/reporting-components/report-model/report-model';

const DistributionReportModel = {
  isStackedChart: reportData =>
    !!(reportData.xcolumns && reportData.ycolumns),

  getBarsChartModel: reportData => {
    if (DistributionReportModel.isStackedChart(reportData)) {
      return reportData.xcolumns.map(xCol => ({
        key: xCol.name,
        name: xCol.name,
        user: xCol.user,
        issue: xCol.issue,
        values: reportData.ycolumns.map(yCol => ({
          key: yCol.name,
          name: yCol.name,
          user: yCol.user,
          issue: yCol.issue,
          issuesQuery: reportData.issuesQueries[xCol.index][yCol.index],
          size: ReportModel.getSizeValue(
            reportData.counts[xCol.index][yCol.index]
          ),
          presentation: ReportModel.getSizePresentation(
            reportData.counts[xCol.index][yCol.index]
          )
        })),
        colorIndex: xCol.colorIndex
      }));
    }
    return ((reportData.columns || []).map(xCol => ({
      user: xCol.user,
      issue: xCol.issue,
      values: (reportData.columns || []).map(yCol => ({
        name: yCol.name,
        user: yCol.user,
        issue: yCol.issue,
        issuesQuery: yCol.issuesQuery,
        size: yCol.name === xCol.name
          ? ReportModel.getSizeValue(yCol.size)
          : 0,
        presentation: yCol.name === xCol.name
          ? ReportModel.getSizePresentation(yCol.size)
          : 0
      })),
      colorIndex: 1
    })));
  },

  getPieChartModel: reportData =>
    ((reportData.columns || []).
      map(xCol => ({
        name: xCol.name,
        issuesQuery: xCol.issuesQuery,
        size: ReportModel.getSizeValue(xCol.size),
        colorIndex: xCol.colorIndex
      }))
    )
};

export default DistributionReportModel;

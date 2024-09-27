import React from 'react';
import PropTypes from 'prop-types';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import ProgressBar from '@jetbrains/ring-ui/components/progress-bar/progress-bar';
import EmptyWidget, {EmptyWidgetFaces} from '@jetbrains/hub-widget-ui/dist/empty-widget';
import withWidgetLoaderHOC from '@jetbrains/hub-widget-ui/dist/widget-title';
import withTimerHOC from '@jetbrains/hub-widget-ui/dist/timer';

import ReportModel from '../../../../lib/reporting-components/report-model/report-model';

import DistributionReportAxises from './distribution-report-axises';
import ReportChart from './report-chart';

class Content extends React.Component {
  static propTypes = {
    report: PropTypes.object,
    error: PropTypes.number,
    youTrack: PropTypes.object,
    dashboardApi: PropTypes.object,
    editable: PropTypes.bool,

    onOpenSettings: PropTypes.func,
    onChangeReportSortOrders: PropTypes.func,
    onChangePresentationMode: PropTypes.func
  };

  renderLoader() {
    return <LoaderInline/>;
  }

  renderFatalError(message) {
    const removeWidget = async () =>
      await this.props.dashboardApi.removeWidget();

    return (
      <EmptyWidget
        face={EmptyWidgetFaces.ERROR}
        message={message}
      >
        {
          this.props.editable &&
          <Link
            pseudo={true}
            onClick={removeWidget}
          >
            {i18n('Remove widget')}
          </Link>
        }
      </EmptyWidget>
    );
  }

  renderReportError(message) {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.OK}
        message={message}
      >
        {
          this.props.editable &&
          <Link
            pseudo={true}
            onClick={this.props.onOpenSettings}
          >
            {i18n('Edit settings')}
          </Link>
        }
      </EmptyWidget>
    );
  }

  renderError(error) {
    if (error === ReportModel.ErrorTypes.NO_YOUTRACK) {
      return this.renderFatalError(
        i18n('Cannot find YouTrack installation')
      );
    }
    if (error === ReportModel.ErrorTypes.NO_REPORT) {
      return this.renderReportError(
        i18n('Cannot find any issue distribution report')
      );
    }
    if (error === ReportModel.ErrorTypes.CANNOT_LOAD_REPORT) {
      return this.renderReportError(i18n('Cannot load selected report'));
    }
    return this.renderFatalError(
      i18n('Oops... Something went wrong =(')
    );
  }

  renderReportBody() {
    const {report, youTrack} = this.props;

    if (ReportModel.isReportCalculation(report)) {
      const fromPercentsCoefficient = 0.01;
      const progressValue = report.status.progress * fromPercentsCoefficient;
      return (
        <div className="report-widget__progress">
          <div>{i18n('Calculating...')}</div>
          <ProgressBar
            className="report-widget__progress-bar"
            value={progressValue}
          />
        </div>
      );
    }

    if (ReportModel.isReportError(report)) {
      return this.renderReportError(report.status.errorMessage);
    }

    if (ReportModel.isTooBigReportDataError(report)) {
      return this.renderReportError(
        i18n('The report cannot be calculated: the filters in the report settings return too many issues')
      );
    }

    if (ReportModel.isNoReportDataError(report)) {
      return this.renderReportError(i18n('There aren\'t any issues that match the filters in the report settings'));
    }

    const {SortOrder} = DistributionReportAxises;

    const getAggregationTitle = () => {
      if (!report.aggregationPolicy) {
        return i18n('Total issues count');
      }
      if (!report.aggregationPolicy.field) {
        return i18n('Total votes count', {total: ''});
      }
      const fieldName = report.aggregationPolicy.field.presentation;
      return i18n('Total {{fieldName}}', {fieldName});
    };

    return (
      <ReportChart
        reportData={report.data}
        presentationMode={report.presentation}
        reportMainSortOrder={SortOrder.getMainAxisSortOrder(report)}
        reportSecondarySortOrder={SortOrder.getSecondaryAxisSortOrder(report)}
        reportMainAxisLabel={
          DistributionReportAxises.getMainAxisPresentation(report)
        }
        reportSecondaryAxisLabel={
          DistributionReportAxises.getSecondaryAxisPresentation(report)
        }
        aggregationTitle={getAggregationTitle()}
        onChangeSortOrders={this.props.onChangeReportSortOrders}
        onChangePresentationMode={this.props.onChangePresentationMode}
        homeUrl={youTrack.homeUrl}
      />
    );
  }

  render() {
    const {report, error} = this.props;

    if (error) {
      return this.renderError(error);
    }
    if (!report) {
      return this.renderLoader();
    }
    return this.renderReportBody();
  }
}

export default withTimerHOC(withWidgetLoaderHOC(Content));

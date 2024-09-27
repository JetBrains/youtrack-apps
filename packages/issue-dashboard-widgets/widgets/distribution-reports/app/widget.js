import React from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import withWidgetLoaderHOC from '@jetbrains/hub-widget-ui/dist/widget-loader';
import 'd3/d3';
import 'nvd3/nv.d3';
import 'nvd3/nv.d3.css';

import ReportModel from '../../../../lib/reporting-components/report-model/report-model';
import BackendTypes from '../../../../lib/reporting-components/backend-types/backend-types';
import {
  loadIssuesDistributionReports,
  getYouTrackService,
  loadIssueDistributionReportWithData,
  recalculateReport,
  saveReportSettings
} from '../../../../lib/reporting-components/resources/resources';
import fetcher from '../../../../lib/reporting-components/fetcher/fetcher';

import Configuration from './configuration';
import {getReportTypePathPrefix} from './distribution-report-types';
import DistributionReportAxises from './distribution-report-axises';
import Content from './content';
import './style/distribution-reports-widget.scss';

class DistributionReportsWidget extends React.Component {
  // eslint-disable-next-line no-magic-numbers
  static DEFAULT_REFRESH_PERIOD = 900;
  // eslint-disable-next-line no-magic-numbers
  static PROGRESS_BAR_REFRESH_PERIOD = 0.5;

  // eslint-disable-next-line complexity
  static applyReportSettingsFromWidgetConfig = (report, config) => {
    if (!config || config.reportId !== (report || {}).id) {
      return report;
    }
    if (!DistributionReportAxises.SortOrder.isEditable(report)) {
      if (config.mainAxisSortOrder) {
        DistributionReportAxises.SortOrder.setMainAxisSortOrder(
          report, config.mainAxisSortOrder
        );
      }
      if (config.secondaryAxisSortOrder) {
        DistributionReportAxises.SortOrder.setSecondaryAxisSortOrder(
          report, config.secondaryAxisSortOrder
        );
      }
      if (config.presentation) {
        report.presentation = config.presentation;
      }
    }
    return report;
  };

  static getDefaultWidgetTitle = () =>
    i18n('Issue Distribution Report');

  static responseReportStatusToError = errStatus => {
    if (errStatus === ReportModel.ResponseStatus.NO_ACCESS) {
      return ReportModel.ErrorTypes.NO_PERMISSIONS_FOR_REPORT;
    }
    if (errStatus === ReportModel.ResponseStatus.NOT_FOUND) {
      return ReportModel.ErrorTypes.CANNOT_LOAD_REPORT;
    }
    return ReportModel.ErrorTypes.UNKNOWN_ERROR;
  }

  static getPresentationModeWidgetTitle = (report, youTrack) => {
    if (report && report.name) {
      const homeUrl = (youTrack || {}).homeUrl;
      const pathReportType = getReportTypePathPrefix(report);
      return {
        text: report.name,
        href: homeUrl && `${homeUrl}reports/${pathReportType}/${report.id}`
      };
    }
    return DistributionReportsWidget.getDefaultWidgetTitle();
  };

  static getConfigAsObject = (configWrapper, fieldsToOverwrite) => {
    return {
      reportId: getFieldValue('reportId'),
      mainAxisSortOrder: getFieldValue('mainAxisSortOrder'),
      secondaryAxisSortOrder: getFieldValue('secondaryAxisSortOrder'),
      presentation: getFieldValue('presentation'),
      youTrack: getFieldValue('youTrack'),
      refreshPeriod: getFieldValue('refreshPeriod')
    };

    function getFieldValue(name) {
      return (fieldsToOverwrite && fieldsToOverwrite[name]) ||
        configWrapper.getFieldValue(name);
    }
  };

  static propTypes = {
    dashboardApi: PropTypes.object.isRequired,
    registerWidgetApi: PropTypes.func.isRequired,
    editable: PropTypes.bool,
    configWrapper: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    const {registerWidgetApi} = props;

    this.state = {
      isConfiguring: false,
      isLoading: true,
      error: ReportModel.ErrorTypes.OK,
      refreshPeriod: DistributionReportsWidget.DEFAULT_REFRESH_PERIOD
    };

    registerWidgetApi({
      onConfigure: () => {
        this.setState({
          isConfiguring: true,
          isLoading: false,
          error: ReportModel.ErrorTypes.OK
        });
      },
      onRefresh: async () => {
        if (this.state.error === ReportModel.ErrorTypes.OK) {
          await this.recalculateReport();
        } else {
          await this.onWidgetRefresh();
        }
      }
    });
  }

  componentDidMount() {
    this.initialize(this.props.dashboardApi);
  }

  // eslint-disable-next-line complexity
  initialize = async dashboardApi => {
    this.setLoadingEnabled(true);
    await this.props.configWrapper.init();

    const youTrack = this.props.configWrapper.getFieldValue('youTrack');
    const ytTrackService = await getYouTrackService(
      dashboardApi, youTrack && youTrack.id
    );
    const hasYouTrack = ytTrackService && ytTrackService.id;
    if (hasYouTrack) {
      this.setYouTrack(ytTrackService);
    } else {
      this.setError(ReportModel.ErrorTypes.NO_YOUTRACK);
    }
    const isNewWidget = this.props.configWrapper.isNewConfig();
    if (isNewWidget || !hasYouTrack) {
      if (isNewWidget) {
        this.openWidgetsSettings();
      }
      this.setState({
        isNewWidget,
        refreshPeriod: DistributionReportsWidget.DEFAULT_REFRESH_PERIOD
      });
      return;
    }

    const configReportId = this.props.configWrapper.getFieldValue('reportId');
    const report = (configReportId && {id: configReportId}) ||
      (await loadIssuesDistributionReports(fetcher().fetchYouTrack))[0];

    if (report) {
      const reportWithData = await this.loadReportWithAppliedConfigSettings(
        report.id,
        ytTrackService
      );
      const refreshPeriod =
        this.props.configWrapper.getFieldValue('refreshPeriod') ||
        DistributionReportsWidget.DEFAULT_REFRESH_PERIOD;
      this.setState(
        {report: reportWithData, refreshPeriod, isLoading: false},
        () => this.recalculateIfRequired()
      );
    } else {
      this.setLoadingEnabled(false);
      this.setError(ReportModel.ErrorTypes.NO_REPORT);
      return;
    }
  };

  setYouTrack(youTrackService) {
    const youTrackId = (youTrackService || {}).id;
    fetcher().setYouTrack(youTrackId);
    BackendTypes.setYtVersion(youTrackService.version);
    this.setState({
      youTrack: {
        id: youTrackId,
        homeUrl: youTrackService.homeUrl
      }
    });
  }

  setError(error) {
    this.setState({
      isLoading: false, error
    });
  }

  setLoadingEnabled(isLoading) {
    this.setState({isLoading});
  }

  async recalculateReport() {
    const {
      report,
      isLoading,
      refreshPeriod,
      isConfiguring
    } = this.state;

    if (isLoading || isConfiguring || !report || !report.status ||
      ReportModel.isReportCalculation(report)) {
      return;
    }

    try {
      report.status = await recalculateReport(fetcher().fetchYouTrack, report);
      this.setState({report, refreshPeriod});
    } catch (e) {
      await this.onWidgetRefresh();
    }
  }

  async recalculateIfRequired() {
    const {report} = this.state;

    if (ReportModel.isCalculationRequired(report)) {
      await this.recalculateReport();
    }
  }

  onWidgetRefresh = async () => {
    const {
      isConfiguring,
      isCalculationCompleted,
      report
    } = this.state;

    if (!isConfiguring && report) {
      const reportWithData =
        await this.loadReportWithAppliedConfigSettings(report.id);

      if (reportWithData) {
        this.setState({
          report: reportWithData,
          error: ReportModel.ErrorTypes.OK,
          isLoading: false,
          isNewWidget: false,
          isCalculationCompleted: isCalculationCompleted
            ? false
            : ReportModel.isReportCalculationCompleted(reportWithData, report)
        }, () => this.recalculateIfRequired());
      }
    }
  };

  async loadReport(reportId, optionalYouTrack) {
    const fetchYouTrack = !optionalYouTrack
      ? fetcher().fetchYouTrack
      : async (url, params) =>
        await this.props.dashboardApi.fetch(optionalYouTrack.id, url, params);
    try {
      return await loadIssueDistributionReportWithData(
        fetchYouTrack, reportId
      );
    } catch (err) {
      this.setError(
        DistributionReportsWidget.responseReportStatusToError(err.status)
      );
      return undefined;
    }
  }

  loadReportWithAppliedConfigSettings =
    async (reportId, optionalYouTrack) =>
      DistributionReportsWidget.applyReportSettingsFromWidgetConfig(
        await this.loadReport(reportId, optionalYouTrack),
        DistributionReportsWidget.getConfigAsObject(this.props.configWrapper)
      );

  saveConfig = async () => {
    const {report, refreshPeriod, youTrack} = this.state;
    await this.props.configWrapper.replace({
      reportId: report.id, youTrack, refreshPeriod
    });
  };

  cancelConfig = async () => {
    const {isNewWidget} = this.state;
    if (isNewWidget) {
      await this.props.dashboardApi.removeWidget();
    } else {
      this.setState({isConfiguring: false});
      await this.props.dashboardApi.exitConfigMode();
      this.initialize(this.props.dashboardApi);
    }
  };

  openWidgetsSettings = () => {
    this.props.dashboardApi.enterConfigMode();
    this.setState({
      isConfiguring: true,
      isLoading: false
    });
  };

  onChangeReportSortOrders =
    async (mainAxisSortOrder, secondaryAxisSortOrder) => {
      const {SortOrder} = DistributionReportAxises;
      const {report} = this.state;

      SortOrder.setMainAxisSortOrder(report, mainAxisSortOrder);
      SortOrder.setSecondaryAxisSortOrder(report, secondaryAxisSortOrder);

      this.setState({report});

      if (this.props.editable) {
        return SortOrder.isEditable(report)
          ? await saveReportSettings(fetcher().fetchYouTrack, report, true)
          : await this.props.configWrapper.update({
            reportId: report.id, mainAxisSortOrder, secondaryAxisSortOrder
          });
      }

      return null;
    };

  onChangeReportPresentation = async presentation => {
    const {report} = this.state;
    report.presentation = presentation;
    this.setState({report});

    if (this.props.editable) {
      return report.editable
        ? await saveReportSettings(fetcher().fetchYouTrack, report, true)
        : await this.props.configWrapper.update({
          reportId: report.id, presentation
        });
    }

    return null;
  };

  renderConfigurationForm() {
    const submitForm = async (selectedReportId, refreshPeriod, youTrack) => {
      // eslint-disable-next-line react/no-access-state-in-setstate
      const reportIsChanged = selectedReportId !== (this.state.report || {}).id;
      this.setState({
        youTrack,
        isLoading: reportIsChanged,
        isConfiguring: false,
        // eslint-disable-next-line react/no-access-state-in-setstate
        report: reportIsChanged ? null : this.state.report,
        error: ReportModel.ErrorTypes.OK
      }, async () => {
        const reportWithData = await this.loadReportWithAppliedConfigSettings(
          selectedReportId, youTrack
        );
        if (reportWithData) {
          this.setState({
            report: reportWithData,
            isLoading: false,
            isNewWidget: false,
            refreshPeriod
          }, async () => await Promise.all([
            this.recalculateIfRequired(), this.saveConfig()
          ]));
        }
      });
    };

    const {
      report, refreshPeriod, youTrack
    } = this.state;

    return (
      <Configuration
        reportId={(report || {}).id}
        refreshPeriod={refreshPeriod}
        onSubmit={submitForm}
        onCancel={this.cancelConfig}
        onGetReportDraft={ReportModel.NewReport.issueDistribution}
        dashboardApi={this.props.dashboardApi}
        youTrackId={(youTrack || {}).id}
      />
    );
  }

  renderContent() {
    const {
      report,
      error,
      isLoading,
      refreshPeriod,
      youTrack,
      isCalculationCompleted
    } = this.state;

    const isCalculation = ReportModel.isReportCalculation(report);
    const tickPeriodSec = (isCalculation || isCalculationCompleted)
      ? DistributionReportsWidget.PROGRESS_BAR_REFRESH_PERIOD
      : refreshPeriod;
    const millisInSec = 1000;

    if (isCalculationCompleted) {
      const COMPLETED_PROGRESS = 100;
      const shouldShowCompletedProgress =
        report.status.progress < COMPLETED_PROGRESS &&
        !ReportModel.isReportError(report);

      if (shouldShowCompletedProgress) {
        report.status.calculationInProgress = true;
        report.status.progress = COMPLETED_PROGRESS;
      }
    }

    return (
      <Content
        report={report}
        error={error}
        youTrack={youTrack}
        dashboardApi={this.props.dashboardApi}
        widgetLoader={isLoading || isCalculation}
        tickPeriod={tickPeriodSec * millisInSec}
        editable={this.props.editable}
        onTick={this.onWidgetRefresh}
        onOpenSettings={this.openWidgetsSettings}
        onChangeReportSortOrders={this.onChangeReportSortOrders}
        onChangePresentationMode={this.onChangeReportPresentation}
      />
    );
  }

  render() {
    const widgetTitle = this.state.isConfiguring
      ? DistributionReportsWidget.getDefaultWidgetTitle()
      : DistributionReportsWidget.getPresentationModeWidgetTitle(
        this.state.report, this.state.youTrack
      );
    const configuration = () => this.renderConfigurationForm();
    const content = withWidgetLoaderHOC(() => this.renderContent());

    return (
      <div className="distribution-reports-widget">
        <ConfigurableWidget
          isConfiguring={this.state.isConfiguring}
          dashboardApi={this.props.dashboardApi}
          widgetTitle={widgetTitle}
          Configuration={configuration}
          Content={content}
        />
      </div>
    );
  }
}

export default DistributionReportsWidget;

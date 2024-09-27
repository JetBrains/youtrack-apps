import React from 'react';
import PropTypes from 'prop-types';
import Input, {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import {
  InfoIcon,
  CompareIcon,
  EyeIcon,
  PencilIcon
} from '@jetbrains/ring-ui/components/icon';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import FilterFieldsSelector
  from '../../../../lib/reporting-components/filter-fields-selector/filter-fields-selector';
import BackendTypes from '../../../../lib/reporting-components/backend-types/backend-types';
import SharingSetting from
  '../../../../lib/reporting-components/sharing-setting/sharing-setting';
import {loadUsers, loadVisibilityUserGroups} from '../../../../lib/reporting-components/resources/resources';
import StandardFormGroup from '../../../../lib/reporting-components/report-form-controls/standard-form-group';
import ReportIssuesFilter from '../../../../lib/reporting-components/report-form-controls/report-issues-filter';
import ReportProjects from '../../../../lib/reporting-components/report-form-controls/report-projects';

import {
  loadReportsFilterFields,
  loadReportsAggregationFilterFields
} from './resources';
import {
  isTypeWithEditableXAxis
} from './distribution-report-types';
import DistributionReportAxises from './distribution-report-axises';

class DistributionReportForm extends React.Component {
  static propTypes = {
    report: PropTypes.object,
    onValidStateChange: PropTypes.func,
    onReportSettingsChange: PropTypes.func,
    disabled: PropTypes.bool,
    currentUser: PropTypes.object,
    fetchYouTrack: PropTypes.func,
    fetchHub: PropTypes.func
  };

  static isNewReport = report => !report.id;

  static canShowSecondaryAxisOption = report =>
    DistributionReportForm.isNewReport(report) ||
    report.$type === BackendTypes.get().MatrixReport;

  static convertOneFieldReportToTwoFieldsReportIfNeeded = report => {
    if (report.$type === BackendTypes.get().MatrixReport) {
      return report;
    }
    report.$type = BackendTypes.get().MatrixReport;
    report.yaxis = {field: report.xaxis.field};
    report.xaxis.$type = undefined;
    report.ysortOrder = report.xsortOrder;
    report.presentation = 'DEFAULT';
    return report;
  };

  static convertTwoFieldsReportToOneFieldReportIfNeeded = report => {
    if (report.$type !== BackendTypes.get().MatrixReport) {
      return report;
    }
    report.$type = BackendTypes.get().FlatDistributionReport;
    report.xaxis = {field: (report.yaxis || {}).field};
    report.yaxis = undefined;
    report.ysortOrder = undefined;
    report.presentation = 'DEFAULT';
    return report;
  };

  static checkReportValidity = report =>
    !!report && !!report.name;

  static toProjectTag = project => ({
    key: project.id,
    label: project.name,
    description: project.shortName,
    model: project
  });

  constructor(props) {
    super(props);

    this.state = {
      report: props.report,
      disabled: props.disabled,
      fetchYouTrack: props.fetchYouTrack,
      fetchHub: props.fetchHub,
      currentUser: props.currentUser,
      userGroups: [],
      users: []
    };
    this.props.onValidStateChange(
      DistributionReportForm.checkReportValidity(props.report)
    );
  }

  componentWillReceiveProps(props) {
    this.setState({
      disabled: props.disabled,
      currentUser: props.currentUser,
      fetchYouTrack: props.fetchYouTrack,
      fetchHub: props.fetchHub
    });
    if ((props.report || {}).id !== (this.state.report || {}).id) {
      this.updateReport(props.report);
    }
  }

  changeReportName = evt =>
    this.getReportEditOperationHandler('name')(evt.target.value);

  getSharingSettingsOptions = async (query = '') => {
    const {report, currentUser, fetchYouTrack} = this.state;

    const groups = await loadVisibilityUserGroups(fetchYouTrack, {query});

    const projectId = ((report || {}).projects || []).
      map(project => project.id);
    const users = await loadUsers(fetchYouTrack, {
      query, permissionId: 'JetBrains.YouTrack.READ_REPORT', projectId
    });

    return {groups, users, currentUser};
  };

  changeSharingSettings = (settingName, options) => {
    const {report} = this.state;
    report[settingName] = {
      permittedUsers: (options || []).
        filter(option => option.$type === 'User'),
      permittedGroups: (options || []).
        filter(option => option.$type === 'UserGroup')
    };
    this.onReportEditOperation(report);
  };

  getReportEditOperationHandler = propertyName =>
    value => {
      const {report} = this.state;
      report[propertyName] = value;
      this.onReportEditOperation(report);
    };

  changeMainFilterField = selected => {
    const {report} = this.state;
    const mainAxis = DistributionReportAxises.getMainAxis(report);
    mainAxis.field = selected;
    this.onReportEditOperation(report);
  };

  changeSplittingBarsFilterField = selected => {
    const {report} = this.state;
    if (selected) {
      DistributionReportForm.
        convertOneFieldReportToTwoFieldsReportIfNeeded(report);
      DistributionReportAxises.getSecondaryAxis(report).field = selected;
    } else {
      DistributionReportForm.
        convertTwoFieldsReportToOneFieldReportIfNeeded(report);
    }
    this.onReportEditOperation(report);
  };

  changeAggregationPolicy = selected => {
    const {report} = this.state;
    if (selected) {
      report.aggregationPolicy = report.aggregationPolicy || {};
      report.aggregationPolicy.field = selected;
    } else {
      report.aggregationPolicy = null;
    }
    this.onReportEditOperation(report);
  };

  changeAxisPlaces = () => {
    const {report} = this.state;
    if (!report.xaxis || !report.yaxis) {
      return;
    }
    const xaxisFieldBuff = report.xaxis.field;
    report.xaxis.field = report.yaxis.field;
    report.yaxis.field = xaxisFieldBuff;
    this.onReportEditOperation(report);
  };

  updateReport(report) {
    this.setState({report});
    const reportIsValid =
      DistributionReportForm.checkReportValidity(report);
    this.props.onValidStateChange(reportIsValid);
    return reportIsValid;
  }

  onReportEditOperation(report) {
    if (this.updateReport(report)) {
      this.props.onReportSettingsChange(report);
    }
  }

  renderIssueDistributionFieldsEditableSelectors() {
    const {report, fetchYouTrack} = this.state;

    const filterFieldsSource = async projects =>
      await loadReportsFilterFields(fetchYouTrack, projects);

    return (
      <div>
        <span className="distribution-reports-widget__filter-field-selector">
          {
            report.yaxis &&
            <span className="distribution-reports-widget__axis-label">
              {'↓'}
            </span>
          }
          <FilterFieldsSelector
            selectedField={
              DistributionReportAxises.getMainAxis(report).field
            }
            projects={report.projects}
            onChange={this.changeMainFilterField}
            filterFieldsSource={filterFieldsSource}
            canBeEmpty={false}
          />
        </span>
        {
          report.yaxis &&
          <CompareIcon
            className="distribution-reports-widget__icon distribution-reports-widget__icon_btn distribution-reports-widget__transpose-icon"
            onClick={this.changeAxisPlaces}
            color={CompareIcon.Color.GRAY}
            size={CompareIcon.Size.Size16}
          />
        }
        {
          DistributionReportForm.canShowSecondaryAxisOption(report) &&
          <span className="distribution-reports-widget__filter-field-selector">
            <span className="distribution-reports-widget__axis-label">
              {report.yaxis ? '→' : ''}
            </span>
            <FilterFieldsSelector
              selectedField={
                report.yaxis
                  ? DistributionReportAxises.getSecondaryAxis(report).field
                  : undefined
              }
              projects={report.projects}
              onChange={this.changeSplittingBarsFilterField}
              filterFieldsSource={filterFieldsSource}
              canBeEmpty={DistributionReportForm.isNewReport(report)}
            />
          </span>
        }
      </div>
    );
  }

  renderIssueDistributionFieldsReadonlyLabels() {
    const {report} = this.state;
    const labels = [
      DistributionReportAxises.getMainAxisPresentation(report),
      report.yaxis &&
      DistributionReportAxises.getSecondaryAxisPresentation(report)
    ].filter(it => !!it).join(` ${i18n('and')} `);

    return (
      <div className="distribution-reports-widget__filter-fields">
        { labels }
      </div>
    );
  }

  renderIssueDistributionFieldsBlock() {
    const {
      report,
      disabled
    } = this.state;

    return (
      <StandardFormGroup label={i18n('Show distribution by')}>
        {
          (!disabled && isTypeWithEditableXAxis(report))
            ? this.renderIssueDistributionFieldsEditableSelectors()
            : this.renderIssueDistributionFieldsReadonlyLabels()
        }
      </StandardFormGroup>
    );
  }

  renderAggregationPolicyBlock() {
    const {report, disabled, fetchYouTrack} = this.state;

    const aggregationFilterFieldsSource = async projects =>
      await loadReportsAggregationFilterFields(fetchYouTrack, projects);

    return (
      <StandardFormGroup
        label={i18n('Show totals for {{aggregationPolicy}}', {aggregationPolicy: ''})}
      >
        <FilterFieldsSelector
          selectedField={(report.aggregationPolicy || {}).field}
          projects={report.projects}
          onChange={this.changeAggregationPolicy}
          filterFieldsSource={aggregationFilterFieldsSource}
          canBeEmpty={true}
          placeholder={i18n('Issues')}
          disabled={disabled}
        />
      </StandardFormGroup>
    );
  }

  renderSharingSettingBlock(settingName, label, title, IconElement) {
    const {
      disabled,
      report,
      currentUser
    } = this.state;

    const sharingSetting = report && report[settingName] || {};
    const implicitSelected = [report && report.owner || currentUser].filter(
      user => !!user
    );

    return (
      <StandardFormGroup label={label}>
        <IconElement
          className="distribution-reports-widget__icon distribution-reports-widget__label"
          color={InfoIcon.Color.GRAY}
          size={InfoIcon.Size.Size14}
        />
        {title}&nbsp;
        <SharingSetting
          getOptions={this.getSharingSettingsOptions}
          value={sharingSetting}
          onChange={this.getReportEditOperationHandler(settingName)}
          disabled={disabled}
          implicitSelected={implicitSelected}
        />
      </StandardFormGroup>
    );
  }

  renderVisibleToBlock() {
    return this.renderSharingSettingBlock(
      'readSharingSettings',
      i18n('Sharing settings'),
      i18n('Can view and use'),
      EyeIcon
    );
  }

  renderUpdateableByBlock() {
    return this.renderSharingSettingBlock(
      'updateSharingSettings',
      '',
      i18n('Can edit'),
      PencilIcon
    );
  }

  renderProjectsSelectorBlock() {
    const {
      report, disabled, fetchYouTrack, fetchHub
    } = this.state;

    return (
      <StandardFormGroup
        label={i18n('Projects')}
      >
        <ReportProjects
          projects={report.projects}
          reportId={(report || {}).id}
          disabled={disabled}
          fetchYouTrack={fetchYouTrack}
          fetchHub={fetchHub}
          onChange={this.getReportEditOperationHandler('projects')}
        />
      </StandardFormGroup>
    );
  }

  renderFilterIssuesBlock() {
    const {
      report,
      fetchYouTrack,
      disabled
    } = this.state;

    return (
      <StandardFormGroup label={i18n('Filter issues')}>
        <ReportIssuesFilter
          disabled={disabled}
          query={report.query}
          fetchYouTrack={fetchYouTrack}
          onChange={this.getReportEditOperationHandler('query')}
        />
      </StandardFormGroup>
    );
  }

  render() {
    const {
      report, disabled
    } = this.state;

    return (
      <div className="ring-form">
        {
          !disabled &&
          <StandardFormGroup
            label={'Name'}
            inputCompensationHack={true}
          >
            <Input
              size={InputSize.FULL}
              value={report.name}
              placeholder={i18n('Report name')}
              onChange={this.changeReportName}
              compact={true}
            />
          </StandardFormGroup>
        }
        {this.renderProjectsSelectorBlock()}
        {this.renderFilterIssuesBlock()}
        {this.renderIssueDistributionFieldsBlock()}
        {this.renderAggregationPolicyBlock()}
        {this.renderVisibleToBlock()}
        {this.renderUpdateableByBlock()}
      </div>
    );
  }
}

export default DistributionReportForm;

import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Tab from '@jetbrains/ring-ui/components/tabs/tab';
import Tabs from '@jetbrains/ring-ui/components/tabs/dumb-tabs';

import {usePermissions} from '../permissions/permissions';


const reportToSelectItem = (report, trimmedLabel) => {
  if (!report) {
    return null;
  }

  const getOptionDescription = currentReport => {
    const description = currentReport.owner &&
      (currentReport.owner.name || currentReport.owner.login);
    return description && currentReport.own
      ? `${description} (${i18n('me')})`
      : description;
  };

  const getOptionLabel = currentReport => (
    currentReport.id
      ? currentReport.name || i18n('Unnamed')
      : i18n('New report')
  );

  const trimLimit = 20;
  const trimToLimit = label => {
    if (!label || label.length < trimLimit) {
      return label;
    }
    return `${(label || '').substring(0, trimLimit).trim()}...`;
  };

  return {
    key: report.id,
    label: trimmedLabel
      ? trimToLimit(getOptionLabel(report))
      : getOptionLabel(report),
    description: getOptionDescription(report),
    model: report
  };
};


const makeReportsOptionsList = reports =>
  reports.map(report => reportToSelectItem(report));


const getSelectedReport = (selectedReport, reports) => (
  selectedReport && selectedReport.id
    ? selectedReport
    : reports[0]
);

const TabId = {
  New: 'new',
  Existing: 'existing'
};


const ReportConfigurationTabs = ({
  report, onChange, children, reportsSource, onCreateReport
}) => {

  const [canCreateReports] =
    usePermissions('JetBrains.YouTrack.CREATE_REPORT');

  const [selectedTab, onChangeSelectedTab] =
    useState(getActiveTab(report, canCreateReports));

  const [reports, onLoadReports] =
    useState([]);

  const [reportDraft, onUpdateDraft] = useState(onCreateReport());
  const [selectedExistingReport, onSelectExistingReport] =
    useState(null);

  const onSelectTab = useCallback(tab => {
    if (tab !== selectedTab) {
      const nextReport = tab === TabId.New
        ? reportDraft
        : (selectedExistingReport || reportDraft);
      onChange(nextReport);
      onChangeSelectedTab(nextReport.id ? TabId.Existing : TabId.New);
    }
  }, [selectedTab, onChange, reportDraft, selectedExistingReport]);

  const onSelectExistingReportOption = useCallback(selected => {
    const selectedReport = selected.model;
    if (selectedReport) {
      onChange(selectedReport);
      onSelectExistingReport(getSelectedReport(selectedReport, reports));
    }
  }, [onChange, reports]);

  useEffect(() => {
    let subscribed = true;
    const tab = canCreateReports ? getActiveTab(report) : TabId.Existing;
    onSelectTab(tab);
    const reportId = (report || {}).id;
    if (reportId || !selectedExistingReport) {
      (async () => {
        const loadedReports = await reportsSource();
        if (subscribed) {
          onLoadReports(loadedReports);
          const newSelectedExistingReport =
            getSelectedReport(report, loadedReports);
          onSelectExistingReport(newSelectedExistingReport);
          onChange(tab === TabId.New ? reportDraft : newSelectedExistingReport);
        }
      })();
    } else if (!reportId) {
      onUpdateDraft(report || reportDraft);
    }
    return () => {
      subscribed = false;
    };
  }, [report, canCreateReports, reportsSource, selectedExistingReport]);

  useEffect(() => {
    onSelectExistingReport(null);
    onLoadReports([]);
  }, [reportsSource]);

  const newReportTabTitle = (
    <span>{i18n('Create new report')}</span>
  );

  const existingReportTabTitle = (
    <span>
      <span>{i18n('Display existing report')}</span>&nbsp;
      <span>
        <Select
          data={makeReportsOptionsList(reports)}
          selected={reportToSelectItem(selectedExistingReport, true)}
          onSelect={onSelectExistingReportOption}
          filter={true}
          label={i18n('Select report')}
          type={Select.Type.INLINE}
        />
      </span>
    </span>
  );

  return (
    <Tabs
      selected={selectedTab}
      onSelect={onSelectTab}
    >
      {
        canCreateReports &&
        <Tab
          id={TabId.New}
          title={newReportTabTitle}
        >
          {children}
        </Tab>
      }
      {
        (reports && reports.length) &&
        <Tab
          id={TabId.Existing}
          title={existingReportTabTitle}
          href="/"
        >
          {children}
        </Tab>
      }
    </Tabs>
  );

  function getActiveTab(currentReport) {
    return (currentReport && currentReport.id) ? TabId.Existing : TabId.New;
  }
};

ReportConfigurationTabs.propTypes = {
  report: PropTypes.object,
  reportsSource: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onCreateReport: PropTypes.func.isRequired,
  children: PropTypes.node
};

export default ReportConfigurationTabs;

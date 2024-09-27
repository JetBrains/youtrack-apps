import React from 'react';
import PropTypes from 'prop-types';

import '@jetbrains/ring-ui/components/form/form.scss';

import {
  loadIssuesDistributionReports,
  loadIssueDistributionReportWithSettings
} from '../../../../lib/reporting-components/resources/resources';
import fetcher from '../../../../lib/reporting-components/fetcher/fetcher';
import BaseConfiguration from '../../../../lib/reporting-components/base-configuration/base-configuration';

import DistributionReportForm from './distribution-report-form';

const reportsSource = async () =>
  await (loadIssuesDistributionReports(
    async (url, params) =>
      await fetcher().fetchYouTrack(url, params)
  ));

const reportsSettingsSource = async reportId =>
  await loadIssueDistributionReportWithSettings(
    fetcher().fetchYouTrack, reportId
  );

const Configuration = ({
  reportId, refreshPeriod, onSubmit, onCancel,
  onGetReportDraft, dashboardApi, youTrackId
}) => (
  <BaseConfiguration
    EditReportForm={DistributionReportForm}
    reportId={reportId}
    refreshPeriod={refreshPeriod}
    onGetReportDraft={onGetReportDraft}
    onSubmit={onSubmit}
    onCancel={onCancel}
    dashboardApi={dashboardApi}
    youTrackId={youTrackId}
    reportsSource={reportsSource}
    reportSettingsSource={reportsSettingsSource}
  />
);

Configuration.propTypes = {
  reportId: PropTypes.string,
  refreshPeriod: PropTypes.number.isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  onGetReportDraft: PropTypes.func.isRequired,
  dashboardApi: PropTypes.object,
  youTrackId: PropTypes.string
};

export default Configuration;

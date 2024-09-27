import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import {WarningIcon} from '@jetbrains/ring-ui/components/icon';
import Link from '@jetbrains/ring-ui/components/link/link';

import {usePermissions} from '../permissions/permissions';
import ReportModel from '../report-model/report-model';

const NoEditPermissionsWarning = ({
  report, onChangeReport
}) => {

  if (report.editable) {
    return '';
  }

  const [canCreateReports] =
    usePermissions('JetBrains.YouTrack.CREATE_REPORT');

  const cloneReport = useCallback(() => {
    onChangeReport({
      ...report,
      ...ReportModel.NewReport.defaultSharingSettings(),
      id: ReportModel.NewReport.NEW_REPORT_ID,
      name: `${report.name} - ${i18n('clone')}`,
      own: true,
      owner: undefined,
      editable: true
    });
  }, [report, onChangeReport]);

  return (
    <div className="ring-form__group">
      <WarningIcon
        className="report-widget__icon"
        size={WarningIcon.Size.Size12}
        color={WarningIcon.Color.GRAY}
      />&nbsp;
      <span>
        <span>
          {i18n('You do not have access to edit report settings.')}
        </span>
        {
          canCreateReports &&
          <span>
            {i18n('If you want to customize your own copy of this report, {{cloneItPlaceholder}}', {cloneItPlaceholder: ''})}
            <Link
              pseudo={true}
              onClick={cloneReport}
            >
              { i18n('{{ifYouWantToCustomizeYourOwnCopyOfThisReportPlaceholder}} clone it', {ifYouWantToCustomizeYourOwnCopyOfThisReportPlaceholder: ''}) }
            </Link>
          </span>
        }
      </span>
    </div>
  );
};

NoEditPermissionsWarning.propTypes = {
  report: PropTypes.object,
  onChangeReport: PropTypes.func.isRequired
};

export default NoEditPermissionsWarning;

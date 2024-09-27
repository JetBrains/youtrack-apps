import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import QueryAssist from '@jetbrains/ring-ui/components/query-assist/query-assist';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {
  underlineAndSuggest
} from '../resources/resources';

const ReportIssuesFilter = ({
  query, disabled, fetchYouTrack, onChange
}) => {

  const queryAssistDataSource = useCallback(async model =>
    await underlineAndSuggest(
      fetchYouTrack, model.query, model.caret
    ),
  [fetchYouTrack]
  );

  const onChangeQueryAssistModel = useCallback(
    model => onChange(model.query || ''),
    [onChange]
  );

  return (
    <QueryAssist
      disabled={disabled}
      query={query}
      placeholder={i18n('Query')}
      onChange={onChangeQueryAssistModel}
      dataSource={queryAssistDataSource}
    />
  );
};

ReportIssuesFilter.propTypes = {
  query: PropTypes.string,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ReportIssuesFilter;

import React, {useCallback} from 'react';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import PropTypes from 'prop-types';

import {loadReportsGroupingFilterFields} from '../resources/resources';
import FilterFieldsSelector from '../filter-fields-selector/filter-fields-selector';
import BackendTypes from '../backend-types/backend-types';

const getWorkItemFields = () => ([
  {
    id: 'WORK_TYPE',
    $type: BackendTypes.get().GroupByTypes,
    presentation: i18n('Work type')
  },
  {
    id: 'WORK_AUTHOR',
    $type: BackendTypes.get().GroupByTypes,
    presentation: i18n('Work author')
  },
  {
    id: 'PARENT_ISSUE',
    $type: BackendTypes.get().GroupByTypes,
    presentation: i18n('Parent issue')
  }
]);

const ReportGroupingControl = ({
  group, projects, disabled, fetchYouTrack, onChange
}) => {

  const filterFieldsSource = async () => {
    const filterFields =
      await loadReportsGroupingFilterFields(fetchYouTrack, projects);
    return getWorkItemFields().concat(filterFields || []);
  };

  const changeGroupBySetting = useCallback(selected => {
    if (!selected) {
      return onChange(null);
    }

    const $type = selected.$type === BackendTypes.get().GroupByTypes
      ? BackendTypes.get().WorkItemBasedGrouping
      : BackendTypes.get().FieldBasedGrouping;
    return onChange(({
      $type,
      id: selected.id,
      field: selected
    }));
  }, [group]);

  return (
    <FilterFieldsSelector
      selectedField={(group || {}).field}
      projects={projects}
      onChange={changeGroupBySetting}
      filterFieldsSource={filterFieldsSource}
      canBeEmpty={true}
      disabled={disabled}
      placeholder={i18n('No grouping')}
    />
  );
};

ReportGroupingControl.propTypes = {
  group: PropTypes.object,
  projects: PropTypes.array,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};

export default ReportGroupingControl;

import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {
  loadWorkItemTypes
} from '../resources/resources';

import ReportTagsInput from './report-tags-input';

const ReportWorkTypes = ({
  workTypes, projects, disabled, fetchYouTrack, onChange
}) => {

  const [loadedWorkTypesOptions, setLoadedWorkTypesOptions] = useState(null);

  const getWorkTypesOptions = useCallback(async ({query}) => {
    let resultOptions = loadedWorkTypesOptions;
    if (!resultOptions) {
      const projectId = (projects).
        map(project => project.id);
      const loadedWorkTypes = await loadWorkItemTypes(
        fetchYouTrack, {query, projectId}
      );
      resultOptions = loadedWorkTypes.map(toWorkTypeTag);
      setLoadedWorkTypesOptions(resultOptions);
    }
    return filterWorkTypesOptions(resultOptions, query);
  }, [workTypes, projects, loadedWorkTypesOptions]);

  useEffect(() => {
    setLoadedWorkTypesOptions(null);
  }, [fetchYouTrack, projects]);

  return (
    <ReportTagsInput
      className="ring-form__group"
      disabled={disabled}
      options={workTypes}
      onChange={onChange}
      optionToTag={toWorkTypeTag}
      placeholder={
        workTypes.length
          ? (!disabled && i18n('Add work type') || '')
          : i18n('All work types')
      }
      maxPopupHeight={250}
      dataSource={getWorkTypesOptions}
    />
  );

  function toWorkTypeTag(type) {
    return ({
      key: type.id,
      label: type.name,
      model: type
    });
  }

  function filterWorkTypesOptions(options, query) {
    const str = (query || '').toLowerCase();
    return (str && options)
      ? (options.filter(
        option => (option.label || '').toLowerCase().indexOf(str) > -1
      ))
      : options;
  }
};

ReportWorkTypes.propTypes = {
  workTypes: PropTypes.array,
  projects: PropTypes.array,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};


export default ReportWorkTypes;

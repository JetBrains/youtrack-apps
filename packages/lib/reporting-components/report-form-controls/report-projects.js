import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {
  loadReportProjects
} from '../resources/resources';

import ReportTagsInput from './report-tags-input';

const ReportProjects = ({
  projects, reportId, disabled, fetchYouTrack, fetchHub, onChange
}) => {

  const [loadedProjects, onLoadProjects] = useState([]);

  let subscribed = true;
  useEffect(() => {
    (async function load() {
      const newProjects = await loadReportProjects(
        fetchYouTrack, fetchHub, {id: reportId}
      );
      if (newProjects && subscribed) {
        onLoadProjects(newProjects);
      }
    }());
    return () => {
      subscribed = false;
    };
  }, [fetchHub, fetchYouTrack, reportId]);


  const getProjectsOptions = useCallback(({query}) => {
    const q = (query || '').toLowerCase();
    return (loadedProjects || []).
      filter(project =>
        !q ||
        (project.name.toLowerCase().indexOf(q) > -1) ||
        (project.shortName.toLowerCase().indexOf(q) === 0)
      ).
      map(toProjectTag);
  }, [loadedProjects]);

  return (
    <ReportTagsInput
      className="ring-form__group"
      disabled={disabled}
      options={projects}
      optionToTag={toProjectTag}
      onChange={onChange}
      placeholder={
        projects.length
          ? (!disabled && i18n('Add project') || '')
          : i18n('All projects')
      }
      maxPopupHeight={250}
      dataSource={getProjectsOptions}
    />
  );

  function toProjectTag(project) {
    return ({
      key: project.id,
      label: project.name,
      description: project.shortName,
      model: project
    });
  }
};


ReportProjects.propTypes = {
  projects: PropTypes.array,
  reportId: PropTypes.string,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  fetchHub: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};


export default ReportProjects;

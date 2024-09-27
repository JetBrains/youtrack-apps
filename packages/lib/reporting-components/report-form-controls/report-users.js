import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {
  loadUsers
} from '../resources/resources';

import ReportTagsInput from './report-tags-input';

const ReportUsers = ({
  users, projects, disabled, fetchYouTrack, onChange
}) => {
  const getUsersOptions = useCallback(async ({query}) => {
    const projectId = (projects || []).map(project => project.id);
    const newUsers = await loadUsers(fetchYouTrack, {query, projectId});
    return (newUsers || []).map(toUserTag);
  }, [projects]);

  return (
    <ReportTagsInput
      className="ring-form__group"
      disabled={disabled}
      options={users}
      onChange={onChange}
      optionToTag={toUserTag}
      placeholder={
        users.length
          ? (!disabled && i18n('Add user') || '')
          : i18n('All users')
      }
      maxPopupHeight={250}
      dataSource={getUsersOptions}
    />
  );

  function toUserTag(user) {
    return ({
      key: user.id,
      label: user.name,
      description: user.login,
      avatar: user.avatarUrl,
      model: user
    });
  }
};

ReportUsers.propTypes = {
  users: PropTypes.array,
  projects: PropTypes.array,
  disabled: PropTypes.bool,
  fetchYouTrack: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};


export default ReportUsers;

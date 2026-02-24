import React from 'react';
import PropTypes from 'prop-types';

import '@jetbrains/ring-ui/components/form/form.scss';

import UserSearch from './UserSearch';
import SelectedUserForm from './SelectedUserForm';

import styles from './app.css';

const Widget = (
  {
    onUserSelect,
    hubService,
    selectedUser,
    revokingAccess,
    onRevokeAccess,
    onCancel
  }
) => (
  <div className={styles.widget}>
    {
      selectedUser &&
      <SelectedUserForm
        onUserSelect={onUserSelect}
        selectedUser={selectedUser}
        onRevokeAccess={onRevokeAccess}
        onCancel={onCancel}
        revokingAccess={revokingAccess}
        hubService={hubService}
      />
    }
    {
      !selectedUser &&
      <UserSearch
        onUserSelect={onUserSelect}
        hubService={hubService}
      />
    }
  </div>
);

Widget.propTypes = {
  onUserSelect: PropTypes.func.isRequired,
  onRevokeAccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  selectedUser: PropTypes.object,
  revokingAccess: PropTypes.bool.isRequired,
  hubService: PropTypes.object.isRequired
};

export default Widget;

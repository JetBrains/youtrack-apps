import React from 'react';
import {connect} from 'react-redux';
import Table from '@jetbrains/ring-ui/components/table/table';
import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {selectRoles} from './ReduxStore';
import styles from './app.css';

const columns = hubURL => [{
  id: 'role',
  title: i18n('Project Roles'),
  className: styles.tableFirstColumn,
  headerClassName: styles.tableFirstColumn,
  getValue: function getValue(projectRole) {
    return (projectRole.role &&
      <Link
        href={`${hubURL}/roles/${projectRole.role.id}`}
        target="_blank"
      >{projectRole.role.name}</Link>
    );
  }
}, {
  id: 'project',
  title: i18n('Project'),
  getValue: function getValue(projectRole) {
    return (projectRole.project &&
      <Link
        href={`${hubURL}/projects-administration/${projectRole.project.id}?tab=access`}
        target="_blank"
      >{projectRole.project.name}</Link>
    );
  }
}];

const ProjectRolesTable = connect(
  state => ({
    columns: columns(state.hubURL),
    data: state.selectedUser.projectRoles || [],
    selection: state.roleSelection
  }),
  dispatch => ({
    onSelect: selection => dispatch(selectRoles(selection))
  })
)(Table);

export default ProjectRolesTable;

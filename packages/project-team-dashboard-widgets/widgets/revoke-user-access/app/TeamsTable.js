import React from 'react';
import {connect} from 'react-redux';
import Table from '@jetbrains/ring-ui/components/table/table';
import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {selectTeams} from './ReduxStore';
import styles from './app.css';

const columns = hubURL => [{
  id: 'project',
  title: i18n('Teams'),
  className: styles.tableFirstColumn,
  headerClassName: styles.tableFirstColumn,
  getValue: function getValue(team) {
    return (team.project &&
      <Link
        href={`${hubURL}/projects-administration/${team.project.id}?tab=team`}
        target="_blank"
      >{team.project.name}</Link>
    );
  }
}];

const TeamsTable = connect(
  state => ({
    columns: columns(state.hubURL),
    data: state.selectedUser.teams || [],
    selection: state.teamSelection
  }),
  dispatch => ({
    onSelect: selection => dispatch(selectTeams(selection))
  })
)(Table);

export default TeamsTable;

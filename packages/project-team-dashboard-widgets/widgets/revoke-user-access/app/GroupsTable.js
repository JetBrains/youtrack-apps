import React from 'react';
import {connect} from 'react-redux';
import Table from '@jetbrains/ring-ui/components/table/table';
import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {selectGroups} from './ReduxStore';
import styles from './app.css';

const columns = hubURL => [{
  id: 'name',
  title: i18n('Groups'),
  className: styles.tableFirstColumn,
  headerClassName: styles.tableFirstColumn,
  getValue: function renderGroupLink(group) {
    return <Link href={`${hubURL}/groups/${group.id}`} target="_blank">{group.name}</Link>;
  }
}];

const GroupsTable = connect(
  state => ({
    columns: columns(state.hubURL),
    data: state.selectedUser.groups || [],
    loading: state.loadingUser,
    selection: state.groupSelection
  }),
  dispatch => ({
    onSelect: selection => dispatch(selectGroups(selection))
  })
)(Table);

export default GroupsTable;

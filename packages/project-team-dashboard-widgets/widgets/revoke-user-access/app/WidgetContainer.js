import PropTypes from 'prop-types';

import {
  selectUser,
  setUserDetails,
  startRevocation,
  cancel,
  finishRevocation
} from './ReduxStore';
import connect from './betterConnect';
import Widget from './Widget';


const loadUserDetails = async (user, dispatch, hubService) => {
  dispatch(selectUser(user));
  const detailedUser = await hubService.requestUser(user.id);
  (detailedUser.projectRoles || []).forEach(projectRole => {
    projectRole.key = projectRole.id;
  });
  dispatch(setUserDetails(detailedUser));
};

const asyncMap = (selection, fn) =>
  Promise.all([...selection.getSelected()].map(fn));

const onRevokeAccess = async (state, dispatch, hubService) => {
  dispatch(startRevocation());

  const {
    selectedUser,
    groupSelection,
    teamSelection,
    roleSelection,
    loginSelection
  } = state;

  await asyncMap(
    groupSelection,
    group => hubService.removeFromGroup(group, selectedUser)
  );
  await asyncMap(
    teamSelection,
    team => hubService.removeFromTeam(team, selectedUser)
  );
  await asyncMap(
    roleSelection,
    projectRole => hubService.revokeProjectRole(selectedUser, projectRole)
  );
  await asyncMap(
    loginSelection,
    login => hubService.removeLogin(selectedUser, login)
  );

  dispatch(finishRevocation());

  await loadUserDetails(selectedUser, dispatch, hubService);
};


const WidgetContainer = connect(
  (state, dispatch, {hubService}) => ({
    hubService,
    selectedUser: state.selectedUser,
    revokingAccess: state.revokingAccess,
    onUserSelect: user => loadUserDetails(user, dispatch, hubService),
    onRevokeAccess: () => onRevokeAccess(state, dispatch, hubService),
    onCancel: () => dispatch(cancel())
  })
)(Widget);

WidgetContainer.propTypes = {
  hubService: PropTypes.object.isRequired
};


export default WidgetContainer;

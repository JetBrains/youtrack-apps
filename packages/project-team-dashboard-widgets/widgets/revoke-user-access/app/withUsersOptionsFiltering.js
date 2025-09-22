import connect from './betterConnect';
import {
  requestMoreUsers,
  requestUsers,
  setMoreUsers,
  setUsers
} from './ReduxStore';


const user2item = user => {
  const email = ((user.profile || {}).email || {}).email;
  return {
    key: user.id,
    label: user.name,
    description: `${user.login} ${email ? `(${email})` : ''}`,
    icon: user.profile.avatar.url,
    user
  };
};

const canLoadMoreUsers = userPage => {
  if (!userPage || !userPage.users) {
    return false;
  }
  return userPage.total > (userPage.skip + userPage.users.length);
};

const loadUsers = async (query, dispatch, hubService) => {
  dispatch(requestUsers(query));
  const userPage = await hubService.requestUserPage(query);
  const users = userPage && userPage.users;
  dispatch(setUsers({users, canLoadMoreUsers: canLoadMoreUsers(userPage)}));
};

const loadMoreUsers = async (dispatch, hubService, {userQuery, users}) => {
  dispatch(requestMoreUsers());
  const userPage = await hubService.requestUserPage(userQuery, users.length);
  const newUsers = userPage && userPage.users;
  dispatch(setMoreUsers({
    users: newUsers,
    canLoadMoreUsers: canLoadMoreUsers(userPage)
  }));
};


function withUsersOptionsFiltering(WrappedComponent) {
  return connect(
    (state, dispatch, {hubService, onUserSelect}) => ({
      loading: state.loadingUsers,
      canLoadMoreUsers: state.canLoadMoreUsers,
      usersOptions: (state.users || []).map(user2item),
      selectedUserOption: state.selectedUser && user2item(state.selectedUser),
      hubService,

      onOpen: () => loadUsers('', dispatch, hubService),
      onFilter: query => loadUsers(query, dispatch, hubService),
      onLoadMore: () => loadMoreUsers(dispatch, hubService, state),
      onSelect: item => onUserSelect(item.user)
    })
  )(WrappedComponent);
}

export default withUsersOptionsFiltering;

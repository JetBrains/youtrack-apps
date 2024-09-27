import {i18n} from 'hub-dashboard-addons/dist/localization';
import List from '@jetbrains/ring-ui/components/list/list';

const {SEPARATOR} = List.ListProps.Type;

function userGroupToSelectOption(userOrGroup) {
  return {
    key: userOrGroup.id,
    label: userOrGroup.name,
    avatar: userOrGroup.avatarUrl,

    icon: userOrGroup.icon,
    model: userOrGroup
  };
}

function hideUsersFromList(users, usersToHide = []) {
  return users.filter(
    user => !usersToHide.some(
      userToHideFromList => userToHideFromList.login === user.login
    )
  );
}

function makeDropdownOptions(
  {bestGroups = [], groups = [], users = []},
  usersToHideFromList = []
) {
  const usersToDisplay = usersToHideFromList && usersToHideFromList.length
    ? hideUsersFromList(users, usersToHideFromList)
    : users;

  const hasBest = bestGroups.length > 0;
  const hasGroups = groups.length > 0;
  const hasUsers = usersToDisplay.length > 0;

  const bestGroupsSeparator = {description: i18n('Recommended groups and teams'), rgItemType: SEPARATOR, key: 'best-groups'};
  const groupsSeparator = {description: hasBest ? i18n('Other groups and teams') : i18n('Groups and teams'), rgItemType: SEPARATOR, key: 'groups'};
  const usersSeparator = {description: i18n('Users'), rgItemType: SEPARATOR, key: 'users'};

  return [
    hasBest ? bestGroupsSeparator : null,
    ...bestGroups.map(userGroupToSelectOption),

    hasGroups ? groupsSeparator : null,
    ...groups.map(userGroupToSelectOption),

    hasUsers ? usersSeparator : null,
    ...usersToDisplay.map(userGroupToSelectOption)
  ].filter(it => it !== null);
}

export {makeDropdownOptions, userGroupToSelectOption, hideUsersFromList};

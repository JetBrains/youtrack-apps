import React from 'react';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';
import {
  UserCardTooltip, SmartUserCardTooltip
} from '@jetbrains/ring-ui/components/user-card/user-card';

import {loadUser} from '../resources/resources';


const UserLink = (
  {user, homeUrl = '', fetchHub}
) => {
  const link = (
    <Link
      href={`${homeUrl}users/${user.ringId || user.id || 'me'}`}
      target="_blank"
    >
      {user.name || user.fullName || user.login}
    </Link>
  );

  if (!user.avatarUrl) {
    if (fetchHub) {
      const loadUserDetails = async () => {
        const userDetails = await loadUser(fetchHub, user.ringId || user.id);
        const avatarUrl = userDetails.avatar
          ? userDetails.avatar.url
          : userDetails.avatarUrl;
        return {...userDetails, ...{avatarUrl}};
      };

      return (
        <SmartUserCardTooltip
          userDataSource={loadUserDetails}
        >
          {link}
        </SmartUserCardTooltip>
      );
    }

    return link;
  }

  return (
    <UserCardTooltip
      user={{
        login: user.login,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        href: `${homeUrl}users/${user.ringId}`
      }}
    >
      {link}
    </UserCardTooltip>
  );
};

UserLink.propTypes = {
  user: PropTypes.object.isRequired,
  homeUrl: PropTypes.string,
  fetchHub: PropTypes.func
};

export default UserLink;

import React from 'react';
import PropTypes from 'prop-types';
import Badge from '@jetbrains/ring-ui/components/badge/badge';
import Link from '@jetbrains/ring-ui/components/link/link';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import Avatar, {Size} from '@jetbrains/ring-ui/components/avatar/avatar';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import UserSelect from './UserSelect';
import styles from './app.css';


const UserProperties = ({user, hubURL, onUserSelect, hubService}) => {
  const email = ((user.profile || {}).email || {});

  return (
    <div className={styles.userInfo}>
      <Avatar
        className={styles.userInfoAvatar}
        onClick={openUserProfile}
        size={Size.Size56}
        url={user.profile.avatar.url}
      />
      <div className={styles.userInfoContent}>
        <div className={styles.userNameLine}>
          <UserSelect
            onUserSelect={onUserSelect}
            hubService={hubService}
          />
          {
            user.banned &&
            (
              <Tooltip title={user.banReason}>
                <Badge
                  className={styles.userTag}
                  invalid={true}
                >{i18n('banned')}</Badge>
              </Tooltip>
            )
          }
        </div>
        <div>
          <Link pseudo={true} onClick={openUserProfile}>
            {user.login}
          </Link>
        </div>
        {
          email.email &&
          <div>
            <span>{email.email}</span>
            {
              email.verified !== null &&
              <Badge
                valid={email.verified}
                className={styles.userTag}
              >
                {email.verified ? i18n('email verified') : i18n('email not verified')}
              </Badge>
            }
          </div>
        }
      </div>
    </div>
  );

  function openUserProfile() {
    window.open(`${hubURL}/users/${user.id}`, '_blank');
  }
};


UserProperties.propTypes = {
  user: PropTypes.object.isRequired,
  hubURL: PropTypes.string,
  onUserSelect: PropTypes.func.isRequired,
  hubService: PropTypes.object.isRequired
};

export default UserProperties;

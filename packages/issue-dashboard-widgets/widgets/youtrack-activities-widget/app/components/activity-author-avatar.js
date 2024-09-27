import React from 'react';
import PropTypes from 'prop-types';

import Avatar, {Size} from '@jetbrains/ring-ui/components/avatar/avatar';

import '../style/activities-widget.css';


class ActivityAuthorAvatar extends React.Component {

  static propTypes = {
    activity: PropTypes.object,
    user: PropTypes.object
  };

  render() {
    const {activity} = this.props;
    const author = this.props.user || activity.author;

    return (
      <div className="aw__author-avatar">
        <Avatar
          className="aw__author-avatar__icon"
          size={Size.Size40}
          url={author.avatarUrl}
        />
        {
          activity.authorGroup && (
            <img
              className="aw__author-avatar__group"
              src={activity.authorGroup.icon}
              alt=""
            />
          )
        }
      </div>
    );
  }
}


export default ActivityAuthorAvatar;

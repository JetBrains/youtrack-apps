import React from 'react';
import PropTypes from 'prop-types';

import {format} from 'date-fns';

import filter from '../activities-filter';

import '../style/activities-widget.css';


class ActivityActionInfo extends React.Component {

  static FORMAT = 'YYYY-MM-DD HH:mm';

  static propTypes = {
    activity: PropTypes.object,
    actionTitle: PropTypes.string
  };

  render() {
    const {activity, actionTitle} = this.props;
    const timestamp = activity.timestamp;
    const pattern = filter.userFormats && filter.userFormats.dateTimePattern;

    return (
      <React.Fragment>
        <span className="aw__action-name">
          {actionTitle}
        </span>
        <span className="aw__action-time">
          {format(timestamp, pattern || ActivityActionInfo.FORMAT)}
        </span>
      </React.Fragment>
    );
  }
}


export default ActivityActionInfo;

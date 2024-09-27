import {Renamed10pxIcon} from '@jetbrains/ring-ui/components/icon';
import React from 'react';

import PropTypes from 'prop-types';

import {i18n} from 'hub-dashboard-addons/dist/localization';

import filter from '../activities-filter';

import '../style/activities-widget.css';

class ActivityStreamLink extends React.Component {

  static propTypes = {
    issue: PropTypes.object,
    activityId: PropTypes.string
  };

  linkToActivityItem() {
    const {issue, activityId} = this.props;
    const issueHref = `${filter.youTrackUrl}issue/${issue.idReadable}`;
    return `${issueHref}#focus=streamItem-${activityId}`;
  }

  render() {
    return (
      <a href={this.linkToActivityItem()}>
        <Renamed10pxIcon
          title={i18n('Open in issue')}
          className="aw__stream-link-icon"
        />
      </a>
    );
  }
}


export default ActivityStreamLink;

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {format} from 'date-fns';

import {i18n} from 'hub-dashboard-addons/dist/localization';

import ActivityAuthorLink from './components/activity-author-link';
import IssueLink from './components/issue-link';
import ActivityStreamLink from './components/activity-stream-link';
import ActivityActionInfo from './components/activity-action-info';
import ActivityAuthorAvatar from './components/activity-author-avatar';

const FORMAT = 'YYYY-MM-DD HH:mm';
const HIGHLIGHT_TIMEOUT = 5000;

class ContentDefaultActivity extends React.Component {

  static propTypes = {
    activity: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      new: props.activity.new
    };
  }

  componentDidMount() {
    if (this.props.activity.new) {
      this.setTimer();
    }
  }

  componentWillUnmount() {
    this.clearTimer();
  }

  setTimer = () => {
    if (this.timer) {
      throw new Error('Timer reset is prohibited');
    }
    this.timer = setTimeout(() => {
      this.setState({new: null});
      this.timer = null;
    }, HIGHLIGHT_TIMEOUT);
  };

  clearTimer = () => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };

  presentChange = changes => {
    if (Array.isArray(changes)) {
      if (changes.length === 0) {
        return '[-]';
      }
      return changes.map(change => `[${change.id}:${change.name}]`).join();
    }
    return changes || '-';
  };

  renderContent = activity => (
    <div>
      <p>{`category: ${activity.category.id}`}</p>
      <p>{`timestamp: ${activity.timestamp} (${format(activity.timestamp, FORMAT)})`}</p>
      <p>{`added: ${this.presentChange(activity.added)}`}</p>
      <p>{`removed: ${this.presentChange(activity.removed)}`}</p>
    </div>
  );

  // eslint-disable-next-line no-unused-vars
  getActionTitle = activity => i18n('updated');

  getCustomAuthor = () => null;

  canBeOpenInIssueStream = () => false;

  render() {
    const {activity} = this.props;
    const issue = activity.target.issue || activity.target;
    const getActivityClassName = () => classNames(
      'aw__entry',
      this.state.new && 'aw__entry_new'
    );

    return (
      <div
        key={`entry-${activity.id}`}
        className={getActivityClassName()}
      >
        <div className="aw__entry__container">
          <IssueLink issue={issue}/>
        </div>
        <div className="aw__entry__user-activity">
          <div className="aw__entry__user-activity__avatar">
            <ActivityAuthorAvatar
              activity={activity}
              user={this.getCustomAuthor()}
            />
          </div>
          <div className="aw__entry__user-activity__data">
            <div className="aw__entry__user-activity__data__header">
              <div className="aw__entry__user-activity__data__header__action">
                <ActivityAuthorLink
                  activity={activity}
                  user={this.getCustomAuthor()}
                />
                <ActivityActionInfo
                  activity={activity}
                  actionTitle={this.getActionTitle(activity)}
                />
              </div>
              {this.canBeOpenInIssueStream() && (
                <div className="aw__entry__user-activity__data__header__stream-link">
                  <ActivityStreamLink
                    issue={issue}
                    activityId={activity.id}
                  />
                </div>
              )
              }
            </div>
            <div className="aw__entry__user-activity__data__content">
              {this.renderContent(activity)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}


export default ContentDefaultActivity;

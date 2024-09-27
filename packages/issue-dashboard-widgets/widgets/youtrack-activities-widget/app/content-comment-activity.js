import React from 'react';

import {i18n} from 'hub-dashboard-addons/dist/localization';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';


class ContentCommentActivity extends ContentDefaultActivity {

  // eslint-disable-next-line react/display-name
  renderContent = activity => (
    <div>
      {activity.added[0].text}
    </div>
  );

  canBeOpenInIssueStream = () => true;

  // eslint-disable-next-line no-unused-vars
  getActionTitle = activity => i18n('commented');
}


export default ContentCommentActivity;

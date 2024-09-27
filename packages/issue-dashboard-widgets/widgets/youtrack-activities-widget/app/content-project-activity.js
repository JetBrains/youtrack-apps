import React from 'react';

import {i18n} from 'hub-dashboard-addons/dist/localization';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';


class ContentProjectActivity extends ContentDefaultActivity {

  toIssueId = key => {
    if (key) {
      const projectKey = key.project.shortName;
      return `${projectKey}, ${projectKey}-${key.numberInProject}`;
    } else {
      return `[${i18n('Unknown')}]`;
    }
  };

  // eslint-disable-next-line react/display-name
  renderContent = activity => {
    const fieldName = i18n('Project');
    return (
      <div>
        <span className="aw__activity__change__field-name">
          {`${fieldName}:`}
        </span>
        <span>
          {this.toIssueId(activity.removed)}
          {' \u27F6 '}
          {this.toIssueId(activity.added)}
        </span>
      </div>
    );
  }
}


export default ContentProjectActivity;

import React from 'react';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';
import IssueCard from './components/issue-card';


class ContentCreatedActivity extends ContentDefaultActivity {

  constructor(props) {
    super(props);
  }

  // eslint-disable-next-line no-unused-vars
  getActionTitle = activity => i18n('created issue');

  // eslint-disable-next-line react/display-name,no-unused-vars
  renderContent = activity => {
    const issue = activity.container;
    const description = issue.trimmedDescription;
    return (
      <div>
        {
          description && (
            <div>
              {description}
            </div>
          )
        }
        <IssueCard
          issue={issue}
          key={`${activity.id}${issue.id}`}
          showMore
        />
      </div>
    );
  };
}


export default ContentCreatedActivity;

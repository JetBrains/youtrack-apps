import React from 'react';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import ContentDefaultActivity from './content-default-activity';
import IssueCard from './components/issue-card';

import './style/activities-widget.css';

class ContentModifiedActivity extends ContentDefaultActivity {
  constructor(props) {
    super(props);
  }

  isRestored = activity => activity.category.id === 'IssueRestoredCategory';
  // eslint-disable-next-line no-unused-vars,max-len
  getActionTitle = activity => (this.isRestored(activity) ? i18n('restored') : i18n('deleted'));

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
        {this.isRestored(activity)
          ? (
            <IssueCard
              issue={issue}
              key={`${activity.id}${issue.id}`}
              showMore
            />
          ) : null}

      </div>
    );
  };
}


export default ContentModifiedActivity;

import React from 'react';

import {i18n} from 'hub-dashboard-addons/dist/localization';

import ContentDefaultActivity from './content-default-activity';
import './style/activities-widget.css';
import IssueCard from './components/issue-card';


class ContentResolvedActivity extends ContentDefaultActivity {

  constructor(props) {
    super(props);
  }

  getActionTitle = activity => {
    if (activity.added) {
      return i18n('resolved issue');
    } else {
      return i18n('reopened issue');
    }
  };

  // eslint-disable-next-line react/display-name,no-unused-vars
  renderContent = activity => {
    const stateActivity = activity.assistantActivities.filter(a => a.field &&
        a.field.customField &&
        a.field.customField.fieldType &&
        a.field.customField.fieldType.valueType === 'state'
    )[0];
    if (stateActivity) {
      const fieldName = stateActivity.field.customField.name;
      const fieldValue = stateActivity.added &&
        stateActivity.added.length &&
        stateActivity.added[0].name;

      return (
        <div>
          <span className="aw__activity__change__field-name">
            {`${fieldName}:`}
          </span>
          <span>
            {fieldValue}
          </span>
        </div>
      );
    } else {
      const issue = activity.target;

      return (
        <div>
          <IssueCard
            issue={issue}
            key={`${activity.id}${issue.id}`}
            showMore
          />
        </div>
      );
    }
  }
}


export default ContentResolvedActivity;

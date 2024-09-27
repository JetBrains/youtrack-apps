import React from 'react';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';
import IssueCard from './components/issue-card';


class ContentLinkActivity extends ContentDefaultActivity {

  // eslint-disable-next-line react/display-name
  renderContent = activity => {
    const fieldName = activity.field.presentation;
    const removedLinks = activity.removed;
    const addedLinks = activity.added;

    return (
      <React.Fragment>
        <div className="aw__activity__link">
          {
            addedLinks.length > 0 && (
              <React.Fragment>
                <div className="aw__activity__link__field-name">
                  {`${fieldName}:`}
                </div>
                <div className="aw__activity__link__change">
                  {addedLinks.map(issue => (
                    <IssueCard
                      issue={issue}
                      removed={false}
                      key={`${activity.id}${issue.id}`}
                    />)
                  )}
                </div>
              </React.Fragment>
            )
          }
        </div>
        <div className="aw__activity__link">
          {
            removedLinks.length > 0 && (
              <React.Fragment>
                <div className="aw__activity__link__field-name">
                  <span className="aw__activity__link__field-name_removed">
                    {fieldName}
                  </span>{':'}
                </div>
                <div className="aw__activity__link__change">
                  {removedLinks.map(issue => (
                    <IssueCard
                      issue={issue}
                      key={`${activity.id}${issue.id}`}
                    />)
                  )}
                </div>
              </React.Fragment>
            )
          }
        </div>
      </React.Fragment>
    );
  };
}


export default ContentLinkActivity;

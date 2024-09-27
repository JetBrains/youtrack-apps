import React from 'react';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';


class ContentTagActivity extends ContentDefaultActivity {

  // eslint-disable-next-line react/display-name
  renderContent = activity => (
    <div key={activity.id}>
      <span>
        <span className="aw__activity__change__field-name">
          {`${activity.field.presentation}:`}
        </span>
        {activity.removed.map(tag =>
          (
            <span key={tag.id} className="aw__activity__change__removed">
              {tag.name}
            </span>
          )
        )}
        {activity.added.map(tag =>
          (
            <span key={tag.id}>
              {tag.name}
            </span>
          )
        )}
      </span>
    </div>
  );
}

export default ContentTagActivity;

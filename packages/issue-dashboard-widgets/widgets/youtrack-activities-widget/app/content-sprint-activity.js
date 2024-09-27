import React from 'react';

import Link from '@jetbrains/ring-ui/components/link/link';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';
import filter from './activities-filter';


class ContentSprintActivity extends ContentDefaultActivity {

  // eslint-disable-next-line react/display-name
  renderSprintLink = (sprint, removed) => (
    <span key={`${sprint.id}-${removed}`}>
      <Link
        href={`${filter.youTrackUrl}agiles/${sprint.agile.id}/${sprint.id}`}
        className={removed ? 'aw__activity__change__removed' : ''}
      >
        {sprint.name}
      </Link>
      &nbsp;
    </span>
  );

  // eslint-disable-next-line react/display-name
  renderContent = activity => {
    const fieldName = activity.field.presentation;
    const wasRemovedOne = activity.removed && activity.removed.length === 1;
    const wasAddedOne = activity.added && activity.added.length === 1;
    return (
      <div key={activity.id}>
        <span>
          <span className="aw__activity__change__field-name">
            {`${fieldName}:`}
          </span>
          {activity.removed.map(sprint =>
            this.renderSprintLink(sprint, true))
          }
          {wasRemovedOne && wasAddedOne && ' \u27F6 '}
          {activity.added.map(sprint =>
            this.renderSprintLink(sprint, false))
          }
        </span>
      </div>
    );
  }
}

export default ContentSprintActivity;

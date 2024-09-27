import React from 'react';

import {i18n} from 'hub-dashboard-addons/dist/localization';

import Link from '@jetbrains/ring-ui/components/link/link';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';

class ContentVcsChangeActivity extends ContentDefaultActivity {

  getCommitHash = change => {
    change.version = change.version || '';
    // eslint-disable-next-line no-magic-numbers
    return change.version.substring(0, 8);
  };

  getCommitUrl = change => change.urls[0];

  // eslint-disable-next-line no-unused-vars
  getActionTitle = activity => i18n('committed changes');

  // eslint-disable-next-line react/display-name
  renderContent = activity => (
    <div>
      <div className="aw__activity__vcs_change_link">
        <Link href={this.getCommitUrl(activity.added[0])} target={'_blank'} >
          {this.getCommitHash(activity.added[0])}
        </Link>
      </div>
      <div>
        {activity.added[0].text.split('\n').map((item, key) =>
          // eslint-disable-next-line react/no-array-index-key
          <span key={`id-${key}`}>{item}<br/></span>)
        }
      </div>
    </div>
  )
}


export default ContentVcsChangeActivity;

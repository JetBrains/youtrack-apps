import React from 'react';
import PropTypes from 'prop-types';

import ContentDefaultActivity from './content-default-activity';
import CollapsibleBlock from './components/collapsible-block';

import './style/activities-widget.css';
import diff from './diff';

class ContentTextActivity extends ContentDefaultActivity {

  static propTypes = {
    fieldName: PropTypes.string
  };

  constructor(props) {
    super(props);
  }

  // eslint-disable-next-line react/display-name
  renderContent = activity => {
    const fieldName = this.props.fieldName || activity.field.presentation;
    const formattedDiff = diff.format('wdiff-html',
      diff(activity.removed || '', activity.added || '')
    );

    return (
      <div className="aw__activity__text">
        <CollapsibleBlock fieldName={fieldName}>
          <div className="aw__activity__text__value">
            <span dangerouslySetInnerHTML={{__html: formattedDiff}}/>
          </div>
        </CollapsibleBlock>
      </div>
    );
  };
}

export default ContentTextActivity;

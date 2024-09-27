import React from 'react';

import {i18n} from 'hub-dashboard-addons/dist/localization';
import {format} from 'date-fns';
import classNames from 'classnames';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';

import ContentCustomFieldActivity from './content-custom-field-activity';


class ContentWorkItemsActivity extends ContentDefaultActivity {

  static FORMAT = 'DD MMM YYYY';

  getCellClassName = cellName => {
    const cellClass = 'aw__activity__work_item__cell';
    return classNames(cellClass, `${cellClass}_${cellName}`);
  };

  getComment = workItem => {
    if (workItem.text && workItem.text.length) {
      return (
        <React.Fragment>
          {this.getSeparator()}
          <div
            className={this.getCellClassName('text')}
          >
            {workItem.text}
          </div>
        </React.Fragment>
      );
    } else {
      return (
        <div/>
      );
    }
  };

  // eslint-disable-next-line react/display-name
  getSeparator = () => (
    <span className={this.getCellClassName('separator')}>
      {'|'}
    </span>
  );

  // eslint-disable-next-line react/display-name
  renderContent = activity => {
    const item = activity.added[0];
    return (
      <div className="aw__activity__work_item__container">
        <div className={this.getCellClassName('date')}>
          <span>{format(item.date, ContentWorkItemsActivity.FORMAT)}</span>
        </div>
        {this.getSeparator()}
        <div className={this.getCellClassName('duration')}>
          {/* eslint-disable-next-line max-len */}
          {ContentCustomFieldActivity.getPeriodPresentation(item.duration.minutes)}
        </div>
        {this.getSeparator()}
        <div
          className={this.getCellClassName('type')}
          title={item.type && item.type.name}
        >
          {(item.type && item.type.name) || i18n('No type')}
        </div>
        {this.getComment(item)}
      </div>
    );
  };

  // eslint-disable-next-line no-unused-vars
  getActionTitle = activity => i18n('added work item');

  getCustomAuthor = () => this.props.activity.added[0].author;
}


export default ContentWorkItemsActivity;

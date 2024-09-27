/* eslint-disable no-magic-numbers */
import React from 'react';
import {format} from 'date-fns';

import {i18n} from 'hub-dashboard-addons/dist/localization';

import ContentDefaultActivity from './content-default-activity';

import './style/activities-widget.css';
import diff from './diff';
import CollapsibleBlock from './components/collapsible-block';
import DateTime from './date-time';
import filter from './activities-filter';

const LOST_EMPTY_VALUE = i18n('[Empty value]');
const UNKNOWN_FORMAT = i18n('[Unknown format]');
const REMOVED_FIELD = i18n('[Removed field]');
const REMOVED_FIELD_TYPE = {valueType: 'removed'};
const SIMPLE_TYPES = [
  'date',
  'date and time',
  'float',
  'integer',
  'period',
  'string'
];

class ContentCustomFieldActivity extends ContentDefaultActivity {

  static DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm';
  static DATE_FORMAT = 'YYYY-MM-DD';

  // eslint-disable-next-line react/display-name
  static getPeriodPresentation = value => {
    const minutes = Math.floor(value % 60);
    const minutesPresentation = `${Math.floor(minutes / 10) || '0'}${minutes % 10 || '0'}${i18n('m')}`;
    const hours = Math.floor(value / 60);
    const hoursPresentation = hours ? (hours + i18n('h')) : '';
    return (
      <React.Fragment>
        <span className="aw__activity__work_item__period_hours">
          {hoursPresentation}
        </span>&nbsp;<span className="aw__activity__work_item__period_minutes">
          {minutesPresentation}
        </span>
      </React.Fragment>
    );
  };

  static getDatePresentation = (value, emptyValue) => {
    if (value) {
      const formats = filter.userFormats;
      const pattern = formats && formats.datePattern ||
        ContentCustomFieldActivity.DATE_FORMAT;
      const date = DateTime.toLocalMidday(value);
      return format(date, pattern);
    } else {
      return emptyValue || LOST_EMPTY_VALUE;
    }
  };

  static getDateTimePresentation = (value, emptyValue) => {
    if (value) {
      const formats = filter.userFormats;
      const pattern = formats && formats.dateTimePattern ||
        ContentCustomFieldActivity.DATE_TIME_FORMAT;
      return format(value, pattern);
    } else {
      return emptyValue || LOST_EMPTY_VALUE;
    }
  };

  static getValuePresentation = (value, emptyValue) => {
    if (value) {
      return value;
    } else {
      return emptyValue || LOST_EMPTY_VALUE;
    }
  };

  static getNamePresentation = (value, emptyValue) => {
    if (value) {
      return value.name || UNKNOWN_FORMAT;
    } else {
      return emptyValue || LOST_EMPTY_VALUE;
    }
  };

  static getRemovedPresentation = (value, emptyValue) => {
    if (value && typeof value === 'object') {
      return value.name || UNKNOWN_FORMAT;
    } else {
      return value || emptyValue || LOST_EMPTY_VALUE;
    }
  };

  // eslint-disable-next-line complexity
  static getPresenter = fieldType => {
    switch (fieldType.valueType) {
      case 'removed':
        return ContentCustomFieldActivity.getRemovedPresentation;
      case 'integer':
      case 'string':
      case 'float':
        return ContentCustomFieldActivity.getValuePresentation;
      case 'date':
        return ContentCustomFieldActivity.getDatePresentation;
      case 'date and time':
        return ContentCustomFieldActivity.getDateTimePresentation;
      case 'period':
        return ContentCustomFieldActivity.getPeriodPresentation;
      default:
        return ContentCustomFieldActivity.getNamePresentation;
    }
  };

  // eslint-disable-next-line max-len
  isSimpleValueField = fieldType => SIMPLE_TYPES.indexOf(fieldType.valueType) >= 0;

  isMultiValueField = fieldType => fieldType.isMultiValue;

  isRemovedField = fieldType => fieldType === 'removed';

  extractSingleValue = values => {
    if (values && values.length) {
      return values[0];
    } else {
      return null;
    }
  };

  renderMultiValueChange(activity, presentValue) {
    return (
      <span>
        <span
          className="aw__activity__change__added"
        >
          {activity.added.map(presentValue).join(',')}
        </span>
        <span
          className="aw__activity__change__removed"
        >
          {activity.removed.map(presentValue).join(',')}
        </span>
      </span>
    );
  }

  renderSingleValueChange(activity, presentValue) {
    return (
      <span>
        {presentValue(this.extractSingleValue(activity.removed))}
        {' \u27F6 '}
        {presentValue(this.extractSingleValue(activity.added))}
      </span>
    );
  }

  renderSimpleValueChange(activity, presentValue) {
    return (
      <span>
        {presentValue(activity.removed)}
        {' \u27F6 '}
        {presentValue(activity.added)}
      </span>
    );
  }

  renderRemovedFieldValueChange(activity, presentValue) {
    // in case of lost information about field we can only guess the type of
    // from the kind of data in added or removed activity fields
    const isArray = obj => (obj && Array.isArray(obj));
    const isMulti = obj => (obj && obj.length && obj.length > 1);

    if (isArray(activity.removed) || isArray(activity.added)) {
      if (isMulti(activity.removed) || isMulti(activity.removed)) {
        return this.renderMultiValueChange(activity, presentValue);
      } else {
        return this.renderSingleValueChange(activity, presentValue);
      }
    } else {
      return this.renderSimpleValueChange(activity, presentValue);
    }
  }

  renderTextValueChange(activity) {
    const fieldName = activity.field.presentation;

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
  }


  // eslint-disable-next-line react/display-name,complexity
  renderContent = activity => {
    const field = activity.field && activity.field.customField;
    const fieldName = field && field.name || REMOVED_FIELD;
    const fieldType = field && field.fieldType || REMOVED_FIELD_TYPE;

    const presenter = ContentCustomFieldActivity.getPresenter(fieldType);
    const presentValue = value => presenter(value, activity.emptyFieldText);

    let change;
    if (this.isRemovedField(fieldType)) {
      change = this.renderRemovedFieldValueChange(activity, presentValue);
    } else if (this.isSimpleValueField(fieldType)) {
      change = this.renderSimpleValueChange(activity, presentValue);
    } else if (this.isMultiValueField(fieldType)) {
      change = this.renderMultiValueChange(activity, presentValue);
    } else if (fieldType.valueType === 'text') {
      return this.renderTextValueChange(activity);
    } else {
      change = this.renderSingleValueChange(activity, presentValue);
    }

    return (
      <div>
        <span className="aw__activity__change__field-name">
          {`${fieldName}:`}
        </span>{change}
      </div>
    );
  };
}


export default ContentCustomFieldActivity;

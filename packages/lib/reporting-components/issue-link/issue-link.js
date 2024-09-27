import React, {useEffect, useState} from 'react';
import fecha from 'fecha';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';
import classNames from 'classnames';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import {loadIssue} from '../resources/resources';

import './color-fields.scss';
import './issue-preview.scss';

const isPriorityField = issueField => {
  const fieldPrototype = issueField &&
    (issueField.projectCustomField || {}).field;
  const fieldPrototypeName = fieldPrototype && fieldPrototype.name;
  return (fieldPrototypeName || '').toLowerCase() === 'priority';
};

const getPriorityIssueField = fields =>
  (fields || []).filter(isPriorityField)[0];

const periodFormatter = value => {
  const EMPTY_PERIOD_VALUE = i18n('{{minCount}}m', {minCount: 0});
  return value.presentation || value.minutes || EMPTY_PERIOD_VALUE;
};

const dateFormatter = value =>
  fecha.format(value, 'D-MM-YYYY');

const dateAndTimeFormatter = value =>
  fecha.format(value, 'D-MM-YYYY HH:mm');

const floatFormatter = value => value;

const fieldValueFormatters = {
  period: periodFormatter,
  date: dateFormatter,
  float: floatFormatter,
  'date and time': dateAndTimeFormatter
};

// eslint-disable-next-line complexity
const formatAsIssueFieldValue = (value, fieldType) => {
  if (!value) {
    return '';
  }
  const formatter = fieldValueFormatters[fieldType];
  if (formatter) {
    return formatter(value);
  }
  return value.localizedName || value.name || value.fullName ||
    value.login || value;
};

// eslint-disable-next-line complexity
const getCustomFieldTextPresentation = (field, noEmptyText) => {
  const values = Array.isArray(field.value)
    ? field.value
    : (field.value && [field.value] || null);
  if (values) {
    const cfPrototype = (field.projectCustomField || {}).field || {};
    const cfPrototypeType = (cfPrototype.fieldType || {}).valueType;
    return values.
      map(value => formatAsIssueFieldValue(value, cfPrototypeType)).
      join(', ');
  }
  return noEmptyText
    ? ''
    : (field.projectCustomField || {}).emptyFieldText;
};

const getColorsIds = field => {
  const values = field && field.value && (
    Array.isArray(field.value) ? field.value : [field.value]
  );
  return (values || []).map(
    val => val.color && val.color.id
  ).filter(val => !!val);
};

const getFieldsValuesToDisplay = (fields, priorityField) => {
  const shownFieldsCount = 3;
  const values = (fields || []).
    filter(field =>
      (!priorityField || field.id !== priorityField.id)).
    map(field => toFieldValue(field)).
    filter(it => !!it);

  return values.splice(0, Math.min(values.length, shownFieldsCount));
};

function toFieldValue(field, noEmptyText) {
  const presentation = field &&
    getCustomFieldTextPresentation(field, noEmptyText);
  return presentation
    ? {id: field.id, colorsIds: getColorsIds(field), presentation}
    : undefined;
}

// eslint-disable-next-line complexity
const IssueLink = (
  {homeUrl, issue, fetchYouTrack, ...restProps}
) => {
  const [isLoading, setIsLoading] = useState(
    !issue.fields || !issue.fields.length
  );
  const [priorityFieldValue, setPriorityFieldValue] = useState(
    toFieldValue(getPriorityIssueField(issue.fields), true)
  );
  const [fieldsValuesToDisplay, setFieldsValuesToDisplay] = useState(
    getFieldsValuesToDisplay(issue.fields, priorityFieldValue)
  );

  useEffect(() => {
    let subscribed = true;

    (async function load() {
      if (isLoading) {
        const loadedIssue = await (
          loadIssue(fetchYouTrack, issue.id).catch(() => issue)
        );
        const newFields = loadedIssue.fields;
        const newPriorityField = getPriorityIssueField(newFields);
        const newFieldsValuesToDisplay =
          getFieldsValuesToDisplay(newFields, newPriorityField);

        if (subscribed) {
          setIsLoading(false);
          setPriorityFieldValue(toFieldValue(newPriorityField, true));
          setFieldsValuesToDisplay(newFieldsValuesToDisplay);
        }
      }
    }());

    return () => {
      subscribed = false;
    };
  }, [issue, fetchYouTrack, isLoading]);

  const priority = priorityFieldValue && (
    <span className={classNames(
      'yt-issue-preview__priority',
      `color-fields__field-${priorityFieldValue.colorsIds[0] || 'none'}`
    )}
    >
      { (priorityFieldValue.presentation || '')[0] }
    </span>
  );

  const tooltip = (
    <div className="yt-issue-preview">
      {
        priority &&
        <span className="yt-issue-preview__priority-wrapper">
          {priority}
        </span>
      }
      <div className="yt-issue-preview__content">
        <div className="yt-issue-preview__header">
          <div>
            <Link
              href={`${homeUrl}issue/${issue.idReadable}`}
              target="_blank"
              className={classNames({
                'yt-issue-preview__id': true,
                'yt-issue-preview__id_resolved': issue.resolved
              })}
            >
              {issue.idReadable}
            </Link>

            <span className="yt-issue-preview__summary">
              {issue.summary}
            </span>
          </div>
        </div>

        <div className="yt-issue-preview__fields">
          {
            isLoading &&
            <center>
              <LoaderInline/>
            </center>
          }

          {
            (fieldsValuesToDisplay || []).
              map(({id, presentation, colorsIds}) => (
                <span
                  key={`field-value-${id}`}
                  title={presentation}
                  className={classNames(
                    'yt-issue-preview__field',
                    colorsIds.length === 1 && `color-fields__plain-color-${colorsIds[0]}`
                  )}
                >
                  {presentation}
                  <span
                    className="yt-issue-preview__field-marker"
                  >
                    {
                      colorsIds.map(colorId => (
                        <span
                          key={`field-value-${id}-color-${colorId}`}
                          className={classNames(
                            'yt-issue-preview__field-sample',
                            `color-fields__field-${colorId}`
                          )}
                        />
                      ))
                    }
                  </span>
                </span>
              ))
          }
        </div>
      </div>
    </div>
  );

  return (
    <Tooltip
      title={tooltip}
      popupProps={{sidePadding: 24}}
    >
      <Link
        href={`${homeUrl}issue/${issue.idReadable}`}
        target="_blank"
        {...restProps}
      >
        {issue.idReadable}
      </Link>
    </Tooltip>
  );
};

IssueLink.propTypes = {
  issue: PropTypes.object.isRequired,
  homeUrl: PropTypes.string,
  fetchYouTrack: PropTypes.func.isRequired
};

export default IssueLink;

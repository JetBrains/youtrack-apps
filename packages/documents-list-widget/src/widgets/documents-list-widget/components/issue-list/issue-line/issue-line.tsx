import React, {useState} from 'react';
import {format} from 'date-fns';
import Link from '@jetbrains/ring-ui-built/components/link/link';
import Tooltip from '@jetbrains/ring-ui-built/components/tooltip/tooltip';
import Icon from '@jetbrains/ring-ui-built/components/icon/icon';
import ChevronUpIcon from '@jetbrains/icons/chevron-up';
import ChevronDownIcon from '@jetbrains/icons/chevron-down';
import type {Color, DateFormats, FieldValue, IssueField, Issue, ColoredSquareModel} from '../types/issue-types';
import {getIssueLink} from '../../../api';

import classNames from 'classnames';
import styles from './issue-line.module.css';

/* This component has been referenced from the old issue list dashboard widget */

const fieldColorToCss = (color: Color) => ({
  background: color.background,
  color: color.foreground,
});

const toArray = <T,>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

const getName = (field: FieldValue): string => field.localizedName || field.name || '';

const getDatePresentation = (timestamp: Date, dateFormats: DateFormats, withTime: boolean): string => {
  return format(timestamp, withTime ? dateFormats.pattern : dateFormats.datePattern);
};

const getValuePresentation = (issueField: IssueField, dateFormats: DateFormats): string => {
  const field = issueField.projectCustomField?.field;
  const fieldType = (field?.fieldType?.valueType) || '';

  return toArray(issueField.value || [])
    .map((value: FieldValue) => {
      if (fieldType.indexOf('date') > -1) {
        return getDatePresentation(value as Date, dateFormats, fieldType.indexOf('time') > -1);
      }
      return (
        getName(value) ||
        value.presentation ||
        value.minutes ||
        value.name ||
        value.login ||
        (value as string)
      );
    })
    .join(', ');
};

const getFirstLetter = (value: FieldValue): string => (getName(value) || 'c')[0].toUpperCase();

const isColoredValue = (value: FieldValue): boolean => {
  return !!(value.color?.id && parseInt(value.color.id, 10) > 0);
};

const getValuableIssueFields = (issue: Issue): IssueField[] => {
  return (issue.fields || [])
    .filter((field: IssueField) => toArray(field.value || []).length > 0)
    .filter((field: IssueField) => {
      const valueType = field.projectCustomField?.field?.fieldType?.valueType;
      return valueType !== 'text';
    });
};

const getColoredSquareModel = (issue: Issue): ColoredSquareModel | null => {
  const makeColorFieldPresentationObject = (issueField: IssueField): ColoredSquareModel | null => {
    const coloredValue = toArray(issueField.value).filter(isColoredValue)[0];
    if (!coloredValue) {
      return null;
    }
    const fieldName = getName(issueField.projectCustomField?.field || ({} as FieldValue));
    return {
      style: fieldColorToCss(coloredValue.color as Color),
      letter: getFirstLetter(coloredValue),
      title: `${fieldName}: ${getName(coloredValue)}`,
      issueField,
    };
  };

  const bundleFields = (issue.fields || []).filter((issueField: IssueField) => !!issueField.projectCustomField?.bundle);
  const priorityField = bundleFields.find((issueField: IssueField) => {
    const field = issueField.projectCustomField?.field || {};
    return (field.name || '').toLowerCase() === 'priority';
  });
  if (priorityField) {
    if (priorityField.value) {
      return makeColorFieldPresentationObject(priorityField);
    }
    return null;
  }
  const fieldWithColoredValues = (issue.fields || []).find((field: IssueField) =>
    toArray(field.value || []).some(isColoredValue),
  );
  if (!fieldWithColoredValues) {
    return null;
  }
  return makeColorFieldPresentationObject(fieldWithColoredValues);
};

const onOpenIssue = (evt: React.MouseEvent): void => evt.stopPropagation();

export interface IssueLineProps {
  issue: Issue;
  expanded: boolean;
  dateFormats: DateFormats;
  onClick?: (e: React.MouseEvent | React.KeyboardEvent) => void;
}

const IssueLine = ({issue, expanded, dateFormats, onClick}: IssueLineProps) => {
  const [highlighted, setHighlighted] = useState(false);

  const coloredSquare = getColoredSquareModel(issue);
  const valuableFields = getValuableIssueFields(issue);

  const renderFieldValue = (issueField: IssueField) => {
    const firstValue = toArray(issueField.value)[0];

    return (
      <div className={styles.fieldValue}>
        {getValuePresentation(issueField, dateFormats)}
        {firstValue && firstValue.avatarUrl && <img className={styles.fieldAvatar} src={firstValue.avatarUrl} alt=""/>}
        {firstValue && isColoredValue(firstValue) && (
          <span
            className={classNames(styles.fieldColor, styles.coloredField)}
            style={fieldColorToCss(firstValue.color as Color)}
          >
              {getFirstLetter(firstValue)}
            </span>
        )}
      </div>
    );
  };

  const renderFields = (issueFields: IssueField[], fixed?: boolean) => {
    return (
      <div className={classNames(styles.widgetFields, {[styles.fieldsFix]: fixed})}>
        {issueFields.map((issueField: IssueField) => (
          <div key={`field-line-${issueField.id}`} className={styles.fieldRow}>
            <div className={styles.widgetField}>
              <div className={styles.fieldTitle}>{getName(issueField.projectCustomField.field as FieldValue)}</div>
              {renderFieldValue(issueField)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const resolved = issue.resolved !== undefined && issue.resolved !== null;
  const issueUrl = getIssueLink(issue.idReadable);
  const chevronIcon = expanded ? ChevronUpIcon : ChevronDownIcon;

  const onMouseOver = () => setHighlighted(true);
  const onMouseLeave = () => setHighlighted(false);

  return (
    <div
      className={classNames(styles.issue, {[styles.issueExpanded]: expanded}, {[styles.issueHighlighted]: highlighted})}
      onMouseOver={onMouseOver}
      onFocus={onMouseOver}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          onClick?.(e);
        }
      }}
    >
      <div className={styles.issueLine}>
        {coloredSquare && (
          <span className={styles.coloredField} style={coloredSquare.style}>
            <Tooltip title={renderFields([coloredSquare.issueField], true)}>{coloredSquare.letter}</Tooltip>
          </span>
        )}

        <div className={classNames(styles.issueInfo, {[styles.noColoredSquare]: !coloredSquare})}>
          <Link className={classNames(styles.issueId, {[styles.resolved]: resolved})} href={issueUrl} target="_blank">
            {issue.idReadable}
          </Link>
          <Link
            key={`issue-summary-${issue.id}`}
            className={classNames(styles.summary, {[styles.resolved]: resolved})}
            href={issueUrl}
            target="_blank"
            onClick={onOpenIssue}
          >
            {issue.summary}
          </Link>
        </div>

        <div className={styles.issueToggle}>
          <Icon glyph={chevronIcon} className={styles.chevronIcon}/>
        </div>
      </div>

      {expanded && (
        <div className={styles.issueExpandedBlock}>
          {renderFields(valuableFields)}
        </div>
      )}
    </div>
  );
};

export default IssueLine;

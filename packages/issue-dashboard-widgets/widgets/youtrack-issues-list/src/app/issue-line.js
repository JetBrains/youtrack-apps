import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import fecha from 'fecha';
import Link from '@jetbrains/ring-ui/components/link/link';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import {
  ChevronUpIcon,
  ChevronDownIcon
} from '@jetbrains/ring-ui/components/icon';

import './style/issues-list-widget.css';

class IssueLine extends React.Component {

  static fieldColorToCss(color) {
    return {
      background: color.background,
      color: color.foreground
    };
  }

  static getValuableIssueFields(issue) {
    return (issue.fields || []).filter(
      field => IssueLine.toArray(field.value || []).length > 0
    ).filter(
      field => {
        const valueType = field.projectCustomField &&
          field.projectCustomField.field &&
          field.projectCustomField.field.fieldType &&
          field.projectCustomField.field.fieldType.valueType;
        return valueType !== 'text';
      }
    );
  }

  static getName(field) {
    return field.localizedName || field.name;
  }

  static getDatePresentation(timestamp, dateFormats, withTime) {
    return fecha.format(
      timestamp,
      withTime ? dateFormats.dateTimePattern : dateFormats.datePattern
    );
  }

  static getValuePresentation(issueField, dateFromats) {
    const field = issueField.projectCustomField &&
      issueField.projectCustomField.field;
    const fieldType = (field && field.fieldType && field.fieldType.valueType) ||
      '';
    return IssueLine.toArray(issueField.value || []).map(value => {
      if (fieldType.indexOf('date') > -1) {
        return IssueLine.getDatePresentation(
          value, dateFromats, fieldType.indexOf('time') > -1
        );
      }
      return IssueLine.getName(value) || value.presentation ||
        value.minutes || value.name || value.login || value;
    }).join(', ');
  }

  static toArray = value =>
    (Array.isArray(value) ? value : [value]);

  static getFirstLetter = value =>
    (IssueLine.getName(value) || 'c')[0].toUpperCase();

  static isColoredValue = value =>
    value.color && value.color.id > 0;

  static getColoredSquareModel(issue) {

    const makeColorFieldPresentationObject = issueField => {
      const coloredValue = IssueLine.toArray(issueField.value).filter(
        IssueLine.isColoredValue
      )[0];
      if (!coloredValue) {
        return null;
      }
      const fieldName = IssueLine.getName(
        issueField.projectCustomField.field || {}
      );
      return {
        style: IssueLine.fieldColorToCss(coloredValue.color),
        letter: IssueLine.getFirstLetter(coloredValue),
        title: `${fieldName}: ${IssueLine.getName(coloredValue)}`,
        issueField
      };
    };

    const bundleFields = (issue.fields || []).filter(
      issueField => !!issueField.projectCustomField.bundle
    );
    const priorityField = bundleFields.filter(
      issueField => {
        const field = issueField.projectCustomField.field || {};
        return (field.name || '').toLowerCase() === 'priority';
      }
    )[0];
    if (priorityField) {
      if (priorityField.value) {
        return makeColorFieldPresentationObject(priorityField);
      }
      return null;
    }
    const fieldWithColoredValues = (issue.fields || []).filter(
      field =>
        IssueLine.toArray(field.value || []).some(IssueLine.isColoredValue)
    )[0];
    if (!fieldWithColoredValues) {
      return null;
    }
    return makeColorFieldPresentationObject(fieldWithColoredValues);
  }

  static onOpenIssue = evt =>
    evt.stopPropagation();

  static propTypes = {
    issue: PropTypes.object,
    homeUrl: PropTypes.string,
    expanded: PropTypes.bool,
    dateFormats: PropTypes.object
  };

  static defaultProps = {
    dateFormats: {
      datePattern: 'YYYY-MM-DD',
      dateTimePattern: 'YYYY-MM-DD\'T\'HH:mm:ss'
    }
  };

  constructor(props) {
    super(props);

    const {issue, expanded} = this.props;
    this.state = {
      issue,
      expanded,
      coloredSquare: IssueLine.getColoredSquareModel(issue),
      valuableFields: IssueLine.getValuableIssueFields(issue)
    };
  }

  static getDerivedStateFromProps(props) {
    const {issue, expanded} = props;
    return {
      issue,
      expanded,
      coloredSquare: IssueLine.getColoredSquareModel(issue),
      valuableFields: IssueLine.getValuableIssueFields(issue)
    };
  }

  renderFieldValue(issueField) {
    const firstValue = IssueLine.toArray(issueField.value)[0];

    return (
      <div className="issues-list-widget__field-value">
        {IssueLine.getValuePresentation(issueField, this.props.dateFormats)}
        {
          firstValue.avatarUrl &&
        (
          <img
            className="issues-list-widget__field-avatar"
            src={firstValue.avatarUrl}
          />
        )
        }
        {
          IssueLine.isColoredValue(firstValue) &&
        (
          <span
            className="issues-list-widget__field-color issues-list-widget__colored-field"
            style={IssueLine.fieldColorToCss(firstValue.color)}
          >
            {IssueLine.getFirstLetter(firstValue)}
          </span>
        )
        }
      </div>
    );
  }

  renderFields(issueFields, fixed) {
    const fixClassName = fixed ? 'issues-list-widget__fields-fix' : '';
    return (
      <div className={`issues-list-widget__fields ${fixClassName}`}>
        {
          issueFields.map(issueField => (
            <div
              key={`field-line-${issueField.id}`}
              className="issues-list-widget__field-row"
            >
              <div className="issues-list-widget__field">
                <div className="issues-list-widget__field-title">
                  {IssueLine.getName(issueField.projectCustomField.field)}
                </div>
                {this.renderFieldValue(issueField)}
              </div>
            </div>
          ))
        }
      </div>
    );
  }

  render() {
    const {
      issue,
      coloredSquare,
      valuableFields,
      expanded,
      highlighted
    } = this.state;
    const {homeUrl} = this.props;
    const normalizedHomeUrl = homeUrl.charAt(homeUrl.length - 1) === '/' ? homeUrl : `${homeUrl}/`;

    const makeHighlighted = flag =>
      () => this.setState({highlighted: flag});

    const getIssueLinkClassName = baseClassName => {
      const resolved = issue.resolved !== undefined && issue.resolved !== null;
      return classNames(
        baseClassName, resolved && `${baseClassName}_resolved`
      );
    };

    const getIssueLineClassName = () => classNames(
      'issues-list-widget__issue',
      expanded && 'issues-list-widget__issue_expanded',
      highlighted && 'issues-list-widget__issue_highlighted'
    );

    return (
      <div
        className={getIssueLineClassName()}
        onMouseOver={makeHighlighted(true)}
        onMouseLeave={makeHighlighted(false)}
      >
        {
          coloredSquare &&
        (
          <span
            className={'issues-list-widget__colored-field'}
            style={coloredSquare.style}
          >
            <Tooltip
              title={this.renderFields([coloredSquare.issueField], true)}
            >
              {coloredSquare.letter}
            </Tooltip>
          </span>
        )
        }
        <div
          className="issues-list-widget__issue-info"
          onClick={IssueLine.onOpenIssue}
        >
          <Link
            className={
              getIssueLinkClassName('issues-list-widget__issue-id')
            }
            href={`${normalizedHomeUrl}issue/${issue.idReadable}`}
            target="_blank"
          >
            {issue.idReadable}
          </Link>
          <Link
            key={`issue-summary-${issue.id}`}
            className={
              getIssueLinkClassName('issues-list-widget__issue-summary')
            }
            href={`${normalizedHomeUrl}issue/${issue.idReadable}`}
            target="_blank"
          >
            {issue.summary}
          </Link>
        </div>
        <div className="issues-list-widget__issue-toggler">
          {
            expanded
              ? (
                <ChevronUpIcon
                  size={ChevronUpIcon.Size.Size14}
                  color={ChevronUpIcon.Color.GRAY}
                />
              )
              : (
                <ChevronDownIcon
                  size={ChevronDownIcon.Size.Size14}
                  color={ChevronDownIcon.Color.GRAY}
                />
              )
          }
        </div>
        {
          expanded &&
        (
          <div
            className="issues-list-widget__issue-expanded-block"
            data-test="issue-line-expanded-block"
          >
            {this.renderFields(valuableFields)}
          </div>
        )
        }
      </div>
    );
  }
}

export default IssueLine;

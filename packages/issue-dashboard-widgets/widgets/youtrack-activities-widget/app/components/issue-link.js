import React from 'react';

import PropTypes from 'prop-types';

import classNames from 'classnames';

import Link from '@jetbrains/ring-ui/components/link/link';

import filter from '../activities-filter';

import '../style/activities-widget.css';

class IssueLink extends React.Component {

  static propTypes = {
    issue: PropTypes.object,
    className: PropTypes.string
  };

  linkToIssue() {
    const {issue} = this.props;
    const issueId = issue.idReadable;
    return `${filter.youTrackUrl}issue/${issueId}`;
  }

  render() {
    const {issue} = this.props;

    const getLinkClassName = isSummary => {
      const valueClass = isSummary
        ? 'aw__issue__summary'
        : 'aw__issue__id';
      const resolved = issue.resolved !== undefined && issue.resolved !== null;
      const modClass = resolved
        ? `${valueClass}_resolved`
        : `${valueClass}`;

      return classNames(valueClass, modClass);
    };

    const issueHref = this.linkToIssue(issue);
    return (
      <div className="aw__issue">
        <Link
          className={getLinkClassName(false)}
          href={issueHref}
        >
          {issue.idReadable}
        </Link>
        <Link
          key={`issue-summary-${issue.id}`}
          className={getLinkClassName(true)}
          href={issueHref}
        >
          {issue.summary}
        </Link>
      </div>
    );
  }
}


export default IssueLink;

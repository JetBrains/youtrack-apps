import React from 'react';
import PropTypes from 'prop-types';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import EmptyWidget, {EmptyWidgetFaces} from '@jetbrains/hub-widget-ui/dist/empty-widget';
import withTimerHOC from '@jetbrains/hub-widget-ui/dist/timer';

import IssueLine from './issue-line';

import './style/issues-list-widget.css';

class Content extends React.Component {

  static propTypes = {
    youTrack: PropTypes.object,
    issues: PropTypes.array,
    issuesCount: PropTypes.number,
    isLoading: PropTypes.bool,
    fromCache: PropTypes.bool,
    isLoadDataError: PropTypes.bool,
    isNextPageLoading: PropTypes.bool,
    onLoadMore: PropTypes.func,
    onEdit: PropTypes.func,
    dateFormats: PropTypes.object,
    editable: PropTypes.bool
  };

  constructor(props) {
    super(props);

    this.state = {
      expandedIssueId: null
    };
  }

  renderNoIssuesError() {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.OK}
        message={i18n('No issues found')}
      >
        {
          this.props.editable &&
        (
          <Link
            pseudo
            onClick={this.props.onEdit}
          >
            {i18n('Edit search query')}
          </Link>
        )
        }
      </EmptyWidget>
    );
  }

  renderLoadDataError() {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.ERROR}
        message={i18n('Can\'t load information from service')}
      />
    );
  }

  getLoadMoreCount() {
    const {issuesCount, issues} = this.props;
    return (issues && issuesCount && issuesCount > issues.length)
      ? issuesCount - issues.length
      : 0;
  }

  renderLoader() {
    return <LoaderInline/>;
  }

  renderWidgetBody() {
    const {
      issues,
      youTrack,
      isNextPageLoading,
      dateFormats
    } = this.props;
    const {expandedIssueId} = this.state;
    const homeUrl = youTrack ? youTrack.homeUrl : '';
    const loadMoreCount = this.getLoadMoreCount();

    const setExpandedIssueId = issueId =>
      evt => {
        if (evt.target && evt.target.href) {
          return;
        }
        const isAlreadyExpanded = issueId === expandedIssueId;
        this.setState({expandedIssueId: isAlreadyExpanded ? null : issueId});
      };

    return (
      <div className="issues-list-widget">
        {
          (issues || []).map(issue => (
            <div
              key={`issue-${issue.id}`}
              onClick={setExpandedIssueId(issue.id)}
            >
              <IssueLine
                issue={issue}
                homeUrl={homeUrl}
                expanded={expandedIssueId === issue.id}
                dateFormats={dateFormats}
              />
            </div>
          ))
        }
        {
          loadMoreCount > 0 && !isNextPageLoading &&
          (
            <div
              onClick={this.props.onLoadMore}
              className="issues-list-widget__load-more"
            >
              <Link pseudo>
                {
                  i18n.plural(loadMoreCount, 'Load 1 more issue', 'Load {{$count}} more issues')
                }
              </Link>
            </div>
          )
        }
        {
          isNextPageLoading && <LoaderInline/>
        }
      </div>
    );
  }

  render() {
    const {
      issues,
      isLoading,
      fromCache,
      isLoadDataError
    } = this.props;

    if (!fromCache) {
      if (isLoadDataError) {
        return this.renderLoadDataError();
      }
      if (isLoading) {
        return this.renderLoader();
      }
    }
    if (!issues || !issues.length) {
      return this.renderNoIssuesError();
    }
    return this.renderWidgetBody();
  }
}


export default withTimerHOC(Content);

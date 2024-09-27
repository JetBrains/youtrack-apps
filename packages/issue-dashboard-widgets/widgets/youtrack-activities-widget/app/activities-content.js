import React from 'react';
import PropTypes from 'prop-types';

import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import Link from '@jetbrains/ring-ui/components/link/link';
import Alert, {Container} from '@jetbrains/ring-ui/components/alert/alert';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import EmptyWidget, {EmptyWidgetFaces} from '@jetbrains/hub-widget-ui/dist/empty-widget';
import withTimerHOC from '@jetbrains/hub-widget-ui/dist/timer';

import ControlLoadMore from './control-load-more';
import ContentDefaultActivity from './content-default-activity';
import ContentCommentActivity from './content-comment-activity';
import ContentProjectActivity from './content-project-activity';
import ContentCustomFieldActivity from './content-custom-field-activity';
import ContentLinkActivity from './content-link-activity';
import ContentTextActivity from './content-text-activity';
import ContentAttachmentActivity from './content-attachment-activity';
import ContentTagActivity from './content-tag-activity';
import ContentCreatedActivity from './content-created-activity';
import ContentResolvedActivity from './content-resolved-activity';
import ContentVcsChangeActivity from './content-vcs-activity';
import ContentSprintActivity from './content-sprint-activity';
import ContentWorkItemsActivity from './content-work-items-activity';
import ContentModifiedActivity from './content-modified-activity';
import './style/activities-widget.css';

class ActivitiesContent extends React.Component {

  static propTypes = {
    activities: PropTypes.array,
    isLoading: PropTypes.bool,
    loadingError: PropTypes.object,
    onUpdateError: PropTypes.func,
    editable: PropTypes.bool,
    onEdit: PropTypes.func,
    hasMore: PropTypes.bool,
    onLoadMore: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  renderNoActivitiesError() {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.OK}
      >
        {
          <div className="aw__empty-widget-message">
            {i18n('There hasn\'t been any activity that matches the filters for this widget within the last 90 days')}
          </div>
        }
        {
          this.props.editable &&
          (
            <Link
              pseudo
              onClick={this.props.onEdit}
            >
              {i18n('Edit widget filters')}
            </Link>
          )
        }
      </EmptyWidget>
    );
  }

  renderLoadDataError = () => (
    <EmptyWidget
      face={EmptyWidgetFaces.ERROR}
      message={i18n('Can\'t load information from service.')}
    />
  );

  renderLoader = () => <LoaderInline/>;

  onLoadMoreError = error => {
    this.props.onUpdateError({incrementalUpdate: error});
  };

  onCloseIncrementalError = () => {
    this.props.onUpdateError({incrementalUpdate: null});
  };

  shouldRender = activity =>
    !(activity.category.id === 'CommentsCategory' && !activity.added[0].text);

  renderBody = () => (
    <div className="aw">
      {
        this.props.loadingError.incrementalUpdate &&
        (
          <Container>
            <Alert
              type={Alert.Type.ERROR}
              closeable={false}
              timeout={3000}
              onCloseRequest={this.onCloseIncrementalError}
              inline
            >
              {this.props.loadingError.incrementalUpdate.title}
            </Alert>
          </Container>
        )
      }
      {
        (this.props.activities || []).filter(
          activity => this.shouldRender(activity)
        ).map(activity => (
          <div key={activity.id}>
            {this.renderActivity(activity)}
          </div>
        ))
      }
      {
        this.props.hasMore && (
          <ControlLoadMore
            onLoadMore={this.props.onLoadMore}
            onLoadMoreError={this.onLoadMoreError}
            hasMore={this.state.hasMore}
          />
        )
      }
    </div>
  );

  // eslint-disable-next-line complexity
  renderActivity = activity => {
    const categoryId = activity.category.id;
    switch (categoryId) {
      case 'CommentsCategory':
        return <ContentCommentActivity activity={activity}/>;
      case 'CustomFieldCategory':
        return <ContentCustomFieldActivity activity={activity}/>;
      case 'SprintCategory':
        return <ContentSprintActivity activity={activity}/>;
      case 'ProjectCategory':
        return <ContentProjectActivity activity={activity}/>;
      case 'LinksCategory':
        return <ContentLinkActivity activity={activity}/>;
      case 'SummaryCategory':
        return (
          <ContentTextActivity
            activity={activity}
            fieldName={i18n('Summary changed')}
          />
        );
      case 'DescriptionCategory':
        return (
          <ContentTextActivity
            activity={activity}
            fieldName={i18n('Description changed')}
          />
        );
      case 'IssueCreatedCategory':
        return <ContentCreatedActivity activity={activity}/>;
      case 'IssueResolvedCategory':
        return <ContentResolvedActivity activity={activity}/>;
      case 'IssueDeletedCategory':
      case 'IssueRestoredCategory':
        return <ContentModifiedActivity activity={activity}/>;
      case 'VcsChangeCategory':
        return <ContentVcsChangeActivity activity={activity}/>;
      case 'WorkItemCategory':
        return <ContentWorkItemsActivity activity={activity}/>;
      case 'TagsCategory':
        return <ContentTagActivity activity={activity}/>;
      case 'AttachmentsCategory':
        return <ContentAttachmentActivity activity={activity}/>;
      default:
        return <ContentDefaultActivity activity={activity}/>;
    }
  };

  render() {
    const {
      activities,
      isLoading,
      loadingError
    } = this.props;

    if (isLoading) {
      return this.renderLoader();
    }
    if (loadingError.initialLoad) {
      return this.renderLoadDataError();
    }
    if (!activities || !activities.length) {
      return this.renderNoActivitiesError();
    }
    return this.renderBody();
  }
}


export default withTimerHOC(ActivitiesContent);

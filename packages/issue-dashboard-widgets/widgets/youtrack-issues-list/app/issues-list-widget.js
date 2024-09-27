import React from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import ServiceResources from '@jetbrains/hub-widget-ui/dist/service-resources';

import {
  loadDateFormats, loadIssues, loadTotalIssuesCount, ISSUES_PACK_SIZE
} from './resources';
import IssuesListEditForm from './issues-list-edit-form';

import './style/issues-list-widget.css';
import Content from './content';

class IssuesListWidget extends React.Component {

  static COUNTER_POLLING_PERIOD_SEC = 240; // eslint-disable-line no-magic-numbers
  static COUNTER_POLLING_PERIOD_MLS = 60000; // eslint-disable-line no-magic-numbers
  static DEFAULT_REFRESH_PERIOD_SEC = 600; // eslint-disable-line no-magic-numbers

  static digitToUnicodeSuperScriptDigit = digitSymbol => {
    const unicodeSuperscriptDigits = [
      0x2070, 0x00B9, 0x00B2, 0x00B3, 0x2074, // eslint-disable-line no-magic-numbers
      0x2075, 0x2076, 0x2077, 0x2078, 0x2079 // eslint-disable-line no-magic-numbers
    ];
    return String.fromCharCode(unicodeSuperscriptDigits[Number(digitSymbol)]);
  };

  static getIssueListLink = (homeUrl, context, search) => { // eslint-disable-line complexity
    let link = homeUrl.charAt(homeUrl.length - 1) === '/' ? homeUrl : `${homeUrl}/`;
    if (context && context.shortName) {
      link += `issues/${context.shortName.toLowerCase()}`;
    } else if (context && context.$type) {
      if (context.$type.toLowerCase().indexOf('tag') > -1) {
        link += `tag/${context.name.toLowerCase()}-${context.id.split('-').pop()}`;
      } else {
        link += `search/${context.name.toLowerCase()}-${context.id.split('-').pop()}`;
      }
    } else {
      link += 'issues';
    }
    if (search) {
      link += `?q=${encodeURIComponent(search)}`;
    }
    return link;
  };

  static getFullSearchPresentation = (context, search) => [
    context && context.name && `#{${context.name}}`, search
  ].filter(str => !!str).join(' ') || `#${i18n('issues')}`;

  static getDefaultYouTrackService =
    async (dashboardApi, predefinedYouTrack) => {
      if (dashboardApi.loadServices) {
        return (await dashboardApi.loadServices('YouTrack')).
          filter(
            it => (predefinedYouTrack ? it.id === predefinedYouTrack.id : true)
          )[0];
      }

      try {
        return await ServiceResources.getYouTrackService(
          dashboardApi, predefinedYouTrack && predefinedYouTrack.id
        );
      } catch (err) {
        return null;
      }
    };

  static youTrackServiceNeedsUpdate = service => !service.name;

  static getDefaultWidgetTitle = () =>
    i18n('Issues List');

  static getWidgetTitle = (search, context, title, issuesCount, youTrack) => {
    let displayedTitle =
      title || IssuesListWidget.getFullSearchPresentation(context, search);
    if (issuesCount > 0) {
      const superScriptIssuesCount = `${issuesCount}`.split('').
        map(IssuesListWidget.digitToUnicodeSuperScriptDigit).join('');
      displayedTitle += ` ${superScriptIssuesCount}`;
    }
    return {
      text: displayedTitle,
      href: youTrack && IssuesListWidget.getIssueListLink(
        youTrack.homeUrl, context, search
      )
    };
  };

  static propTypes = {
    dashboardApi: PropTypes.object,
    configWrapper: PropTypes.object,
    registerWidgetApi: PropTypes.func,
    editable: PropTypes.bool
  };

  constructor(props) {
    super(props);
    const {registerWidgetApi} = props;

    this.state = {
      isConfiguring: false,
      isLoading: true,
      refreshPeriod: IssuesListWidget.DEFAULT_REFRESH_PERIOD_SEC
    };
    this.missedUpdate = false;

    registerWidgetApi({
      onConfigure: () => this.setState({
        isConfiguring: true,
        isLoading: false,
        isLoadDataError: false
      }),
      onRefresh: () => this.loadIssues(),
      getExternalWidgetOptions: () => ({
        authClientId:
          (this.props.configWrapper.getFieldValue('youTrack') || {}).id
      })
    });
  }

  componentDidMount() {
    this.initialize(this.props.dashboardApi);
  }

  componentWillUnmount = () => {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  initialize = async dashboardApi => {
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.setState({isLoading: true});
    await this.props.configWrapper.init();

    const youTrackService =
      await IssuesListWidget.getDefaultYouTrackService(
        dashboardApi, this.props.configWrapper.getFieldValue('youTrack')
      );

    if (this.props.configWrapper.isNewConfig()) {
      this.initializeNewWidget(youTrackService);
    } else {
      await this.initializeExistingWidget(youTrackService);
    }
  };

  initializeNewWidget(youTrackService) {
    if (youTrackService && youTrackService.id) {
      this.setState({
        isConfiguring: true,
        youTrack: youTrackService,
        isLoading: false
      });
    }
    this.setState({isLoadDataError: true, isLoading: false});
  }

  async initializeExistingWidget(youTrackService) {
    const search = this.props.configWrapper.getFieldValue('search');
    const context = this.props.configWrapper.getFieldValue('context');
    const refreshPeriod =
      this.props.configWrapper.getFieldValue('refreshPeriod');
    const title = this.props.configWrapper.getFieldValue('title');

    this.setState({
      title,
      search: search || '',
      context,
      refreshPeriod:
        refreshPeriod || IssuesListWidget.COUNTER_POLLING_PERIOD_SEC
    });
    await this.showListFromCache(search, context);

    if (youTrackService && youTrackService.id) {
      const onYouTrackSpecified = async () => {
        await this.loadIssues(search, context);
        const dateFormats = await loadDateFormats(
          this.fetchYouTrack
        );
        this.setState({dateFormats, isLoading: false});
      };
      this.setYouTrack(youTrackService, onYouTrackSpecified);
    }
  }

  async showListFromCache(search, context) {
    const {dashboardApi} = this.props;
    const cache = (await dashboardApi.readCache() || {}).result;
    if (cache && cache.search === search &&
      (cache.context || {}).id === (context || {}).id) {
      this.setState({issues: cache.issues, fromCache: true});
    }
  }

  setYouTrack(youTrackService, onAfterYouTrackSetFunction) {
    const {homeUrl} = youTrackService;

    this.setState({
      youTrack: {
        id: youTrackService.id, homeUrl
      }
    }, async () => await onAfterYouTrackSetFunction());

    if (IssuesListWidget.youTrackServiceNeedsUpdate(youTrackService)) {
      const {dashboardApi} = this.props;
      ServiceResources.getYouTrackService(
        dashboardApi, youTrackService.id
      ).then(
        updatedYouTrackService => {
          const shouldReSetYouTrack = updatedYouTrackService &&
            !IssuesListWidget.youTrackServiceNeedsUpdate(
              updatedYouTrackService
            ) && updatedYouTrackService.homeUrl !== homeUrl;
          if (shouldReSetYouTrack) {
            this.setYouTrack(
              updatedYouTrackService, onAfterYouTrackSetFunction
            );
            if (!this.state.isConfiguring && this.props.editable) {
              this.props.configWrapper.update({
                youTrack: {
                  id: updatedYouTrackService.id,
                  homeUrl: updatedYouTrackService.homeUrl
                }
              });
            }
          }
        }
      );
    }
  }

  submitConfiguration = async formParameters => {
    const {
      search, title, context, refreshPeriod, selectedYouTrack
    } = formParameters;
    this.setYouTrack(
      selectedYouTrack, async () => {
        this.setState(
          {search: search || '', context, title, refreshPeriod},
          async () => {
            await this.loadIssues();
            await this.props.configWrapper.replace({
              search,
              context,
              title,
              refreshPeriod,
              youTrack: {
                id: selectedYouTrack.id,
                homeUrl: selectedYouTrack.homeUrl
              }
            });
            this.setState(
              {isConfiguring: false, fromCache: false}
            );
          }
        );
      }
    );
  };

  cancelConfiguration = async () => {
    if (this.props.configWrapper.isNewConfig()) {
      await this.props.dashboardApi.removeWidget();
    } else {
      this.setState({isConfiguring: false});
      await this.props.dashboardApi.exitConfigMode();
      this.initialize(this.props.dashboardApi);
    }
  };

  fetchYouTrack = async (url, params) => {
    const {dashboardApi} = this.props;
    const {youTrack} = this.state;
    return await dashboardApi.fetch(youTrack.id, url, params);
  };

  editSearchQuery = () =>
    this.setState({isConfiguring: true});

  renderConfiguration = () => (
    <div className="issues-list-widget">
      <IssuesListEditForm
        search={this.state.search}
        context={this.state.context}
        title={this.state.title}
        refreshPeriod={this.state.refreshPeriod}
        onSubmit={this.submitConfiguration}
        onCancel={this.cancelConfiguration}
        dashboardApi={this.props.dashboardApi}
        youTrackId={this.state.youTrack.id}
      />
    </div>
  );

  loadIssues = async (search, context) => {
    if (document.hidden) {
      this.missedUpdate = true;
      return;
    }
    this.missedUpdate = false;
    try {
      await this.loadIssuesUnsafe(search, context);
    } catch (error) {
      this.setState({isLoadDataError: true});
    }
  };

  onVisibilityChange = () => {
    if (!document.hidden && this.missedUpdate) {
      this.loadIssues();
    }
  }

  loadIssuesUnsafe = async (search, context) => {
    const currentSearch = search || this.state.search;
    const currentContext = context || this.state.context;
    const issues = await loadIssues(
      this.fetchYouTrack, currentSearch, currentContext
    );
    if (Array.isArray(issues)) {
      this.setState({issues, fromCache: false, isLoadDataError: false});
      this.props.dashboardApi.storeCache({
        search: currentSearch, context: currentContext, issues
      });
      this.loadIssuesCount(issues, currentSearch, currentContext);
    }
  };

  loadNextPageOfIssues = async () => {
    const {issues, search, context} = this.state;
    const loadMoreCount = this.getLoadMoreCount();
    if (loadMoreCount > 0) {
      this.setState({isNextPageLoading: true});
      const newIssues = await loadIssues(
        this.fetchYouTrack, search, context, issues.length
      );
      this.setState({
        isNextPageLoading: false,
        issues: issues.concat(newIssues || [])
      });
    }
  };

  loadIssuesCount = async (issues, search, context) => {
    const issuesCount = (issues.length && issues.length >= ISSUES_PACK_SIZE)
      ? await loadTotalIssuesCount(
        this.fetchYouTrack, issues[0], search, context
      )
      : (issues.length || 0);

    this.setState({issuesCount});

    if (issuesCount === -1) {
      setTimeout(
        () => this.loadIssuesCount(issues, search, context),
        IssuesListWidget.COUNTER_POLLING_PERIOD_MLS
      );
    }
  };

  getLoadMoreCount() {
    const {issuesCount, issues} = this.state;
    return (issues && issuesCount && issuesCount > issues.length)
      ? issuesCount - issues.length
      : 0;
  }

  renderContent = () => {
    const {
      issues,
      isLoading,
      fromCache,
      isLoadDataError,
      dateFormats,
      issuesCount,
      isNextPageLoading,
      refreshPeriod,
      youTrack
    } = this.state;
    const millisInSec = 1000;

    return (
      <Content
        youTrack={youTrack}
        issues={issues}
        issuesCount={issuesCount}
        isLoading={isLoading}
        fromCache={fromCache}
        isLoadDataError={isLoadDataError}
        isNextPageLoading={isNextPageLoading}
        onLoadMore={this.loadNextPageOfIssues}
        onEdit={this.editSearchQuery}
        dateFormats={dateFormats}
        tickPeriod={refreshPeriod * millisInSec}
        onTick={this.loadIssues}
        editable={this.props.editable}
      />
    );
  };

  // eslint-disable-next-line complexity
  render() {
    const {
      isConfiguring,
      search,
      context,
      title,
      issuesCount,
      youTrack
    } = this.state;

    const widgetTitle = isConfiguring
      ? IssuesListWidget.getDefaultWidgetTitle()
      : IssuesListWidget.getWidgetTitle(
        search, context, title, issuesCount, youTrack
      );

    return (
      <ConfigurableWidget
        isConfiguring={isConfiguring}
        dashboardApi={this.props.dashboardApi}
        widgetTitle={widgetTitle}
        widgetLoader={this.state.isLoading}
        Configuration={this.renderConfiguration}
        Content={this.renderContent}
      />
    );
  }
}


export default IssuesListWidget;

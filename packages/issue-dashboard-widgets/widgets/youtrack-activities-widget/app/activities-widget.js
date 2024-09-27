import React from 'react';
import PropTypes from 'prop-types';

import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import ServiceResources from '@jetbrains/hub-widget-ui/dist/service-resources';
import {observer} from 'mobx-react';

import {i18n} from 'hub-dashboard-addons/dist/localization';

import ActivitiesEditForm from './activities-edit-form';
import ActivitiesContent from './activities-content';
import {
  loadActivities,
  loadActivitiesPage,
  loadConfigL10n,
  loadMeProfile
} from './resources';
import DateTime from './date-time';
import filter from './activities-filter';

const MILLIS_IN_SEC = 1000;

@observer
class ActivitiesWidget extends React.Component {

  static getDefaultYouTrackService =
    async (dashboardApi, predefinedYouTrackId) => {
      try {
        // TODO: pass min-required version here
        return await ServiceResources.getYouTrackService(
          dashboardApi, predefinedYouTrackId
        );
      } catch (err) {
        return null;
      }
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
      isLoading: false,
      loadingError: {}
    };

    registerWidgetApi({
      onConfigure: () => this.setState({
        isConfiguring: true,
        isLoading: false,
        loadingError: {}
      }),
      onRefresh: () => this.tryLoadNewActivities()
    });
  }

  componentDidMount() {
    this.initialize(this.props.dashboardApi);
    filter.dashboardApi = this.props.dashboardApi;
  }

  initialize = async dashboardApi => {
    await this.props.configWrapper.init();

    if (this.props.configWrapper.isNewConfig()) {
      await this.initializeNewWidget(dashboardApi);
    } else {
      await this.initializeExistingWidget(dashboardApi);
    }
  };

  createUserDateFormats = async () => {
    try {
      const profile = await loadMeProfile(this.fetchYouTrack);
      const dateFormats = (profile && profile.dateFieldFormat) || {};
      return {
        datePattern: DateTime.toFechaFormat(dateFormats.datePattern),
        dateTimePattern: DateTime.toFechaFormat(dateFormats.pattern)
      };
    } catch (e) {
      return null;
    }
  };

  createDefaultQuery = async () => {
    try {
      const config = await loadConfigL10n(this.fetchYouTrack);
      const l10nQueries = config.l10n.predefinedQueries;
      return `${l10nQueries.by}: ${l10nQueries.me}`;
    } catch (e) {
      return '';
    }
  };

  async initializeNewWidget(dashboardApi) {
    const youTrackService = await ActivitiesWidget.getDefaultYouTrackService(
      dashboardApi, filter.youTrackId
    );
    if (youTrackService && youTrackService.id) {
      await this.setNewService(youTrackService);
      this.setState({isConfiguring: true});
    }
  }

  async initializeExistingWidget(dashboardApi) {
    await filter.restore(this.props);

    const youTrackService = await ActivitiesWidget.getDefaultYouTrackService(
      dashboardApi, filter.youTrackId
    );

    if (youTrackService && youTrackService.id) {
      filter.youTrackId = youTrackService.id;
      filter.youTrackUrl = youTrackService.homeUrl;
      filter.userFormats = await this.createUserDateFormats();
      await filter.sync(this.props);
      this.setState({isConfiguring: false});
      await this.reload();
    }
  }

  setNewService = async selectedYouTrack => {
    filter.youTrackId = selectedYouTrack.id;
    filter.youTrackUrl = selectedYouTrack.homeUrl;
    filter.query = await this.createDefaultQuery();
    filter.userFormats = await this.createUserDateFormats();
  };

  fetchYouTrack = async (url, params) => {
    const {dashboardApi} = this.props;
    return await dashboardApi.fetch(filter.youTrackId, url, params);
  };

  // eslint-disable-next-line complexity
  tryLoadNewActivities = async () => {
    if (document.hidden) {
      return;
    }
    try {
      const lastTimestamp = (this.state || {}).timestamp;
      const timestamp = lastTimestamp || filter.recentPeriodStart;
      const incActivities = await loadActivities(
        this.fetchYouTrack,
        {
          author: filter.author,
          query: filter.query,
          start: timestamp && (timestamp + 1),
          categoriesIds: filter.categoriesIds
        }
      );
      incActivities.forEach(activity => {
        activity.new = true;
      });
      const newest = incActivities[0];
      const oldActivities = this.state.activities || [];
      const newActivities = incActivities.concat(oldActivities);
      this.setState({
        activities: newActivities,
        timestamp: newest && newest.timestamp || timestamp
      });
    } catch (error) {
      this.updateError({
        incrementalUpdate: {
          title: i18n('Could not load new activities'),
          message: error.message
        }
      });
    }
  };

  loadActivitiesPage = async loadMore => {
    const {cursor} = this.state;
    const page = await loadActivitiesPage(
      this.fetchYouTrack,
      {
        cursor: loadMore && cursor,
        author: filter.author,
        query: filter.query,
        categoriesIds: filter.categoriesIds,
        start: filter.recentPeriodStart
      }
    );
    const newTimestamp = this.updatedTimestamp(loadMore, page);
    const newActivities = this.updatedActivities(loadMore, page);
    this.setState({
      activities: newActivities,
      timestamp: newTimestamp,
      cursor: page.beforeCursor,
      hasMore: page.hasBefore
    });
  };

  updatedActivities(loadMore, page) {
    const oldActivities = loadMore ? (this.state.activities || []) : [];
    return oldActivities.slice().concat(page.activities);
  }

  updatedTimestamp(loadMore, page) {
    const newest = page.activities[0];
    const oldTimestamp = loadMore ? this.state.timestamp : null;
    return newest && newest.timestamp || oldTimestamp;
  }

  reload = async () => {
    try {
      this.setState({isLoading: true});
      await this.loadActivitiesPage(false);
    } catch (error) {
      this.setState({loadingError: {initialLoad: error.message}});
    } finally {
      this.setState({isLoading: false});
    }
  };

  updateError = mergeError => {
    this.setState({loadingError: mergeError});
  };

  loadMore = async () => {
    await this.loadActivitiesPage(true);
  };

  editConfiguration = () => {
    this.setState({isConfiguring: true});
  };

  submitConfiguration = async () => {
    await filter.sync(this.props);
    this.setState({isConfiguring: false});
    await this.reload();
  };

  cancelConfiguration = async () => {
    if (this.props.configWrapper.isNewConfig()) {
      await this.props.dashboardApi.removeWidget();
    } else {
      await filter.restore(this.props);
      this.setState({isConfiguring: false});
      await this.props.dashboardApi.exitConfigMode();
    }
  };

  getWidgetTitle = () => {
    const title = filter.title;
    if (title) {
      return title;
    } else {
      const query = filter.query;
      return query && query.length
        ? i18n('Issue Activity Feed \u2014 ') + query
        : i18n('Issue Activity Feed');
    }
  };

  renderConfiguration = () => (
    <ActivitiesEditForm
      submitConfig={this.submitConfiguration}
      cancelConfig={this.cancelConfiguration}
      onServiceChange={this.setNewService}
      dashboardApi={this.props.dashboardApi}
    />
  );

  renderContent = () => (
    <ActivitiesContent
      activities={this.state.activities}
      isLoading={this.state.isLoading}
      loadingError={this.state.loadingError}
      onUpdateError={this.updateError}
      hasMore={this.state.hasMore}
      onLoadMore={this.loadMore}
      editable={this.props.editable}
      tickPeriod={filter.refreshPeriod * MILLIS_IN_SEC}
      onTick={this.tryLoadNewActivities}
      onEdit={this.editConfiguration}
    />
  );

  render() {
    const {
      isConfiguring,
      isLoading
    } = this.state;

    return (
      <ConfigurableWidget
        isConfiguring={isConfiguring}
        dashboardApi={this.props.dashboardApi}
        widgetTitle={this.getWidgetTitle()}
        widgetLoader={isLoading}
        Configuration={this.renderConfiguration}
        Content={this.renderContent}
      />
    );
  }
}

export default ActivitiesWidget;

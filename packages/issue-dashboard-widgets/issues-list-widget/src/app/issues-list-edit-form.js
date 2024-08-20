import React from 'react';
import PropTypes from 'prop-types';
import QueryAssist from '@jetbrains/ring-ui/components/query-assist/query-assist';
import Input, {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import Select from '@jetbrains/ring-ui/components/select/select';
import Link from '@jetbrains/ring-ui/components/link/link';
import {Tabs, Tab} from '@jetbrains/ring-ui/components/tabs/tabs';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import HttpErrorHandler from '@jetbrains/hub-widget-ui/dist/http-error-handler';
import RefreshPeriod from '@jetbrains/hub-widget-ui/dist/refresh-period';
import ConfigurationForm from '@jetbrains/hub-widget-ui/dist/configuration-form';
import ServiceResources from '@jetbrains/hub-widget-ui/dist/service-resources';
import '@jetbrains/ring-ui/components/form/form.scss';

import DebounceDecorator from './debounceDecorator';
import {
  underlineAndSuggest,
  loadIssues,
  loadPinnedIssueFolders
} from './resources';
import './style/issues-list-widget.css';

const MIN_YOUTRACK_VERSION = '2017.4.38723';

class IssuesListEditForm extends React.Component {
  static FILTERS_TYPES = {
    PROJECTS: 0,
    TAGS: 1,
    SEARCHES: 2
  };

  static EVERYTHING_CONTEXT_OPTION = {
    id: '-1',
    label: i18n('Everything')
  };

  static propTypes = {
    search: PropTypes.string,
    context: PropTypes.object,
    title: PropTypes.string,
    refreshPeriod: PropTypes.number,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
    dashboardApi: PropTypes.object,
    youTrackId: PropTypes.string
  };

  constructor(props) {
    super(props);

    const selectedYouTrack = {
      id: props.youTrackId
    };
    this.state = {
      search: props.search || '',
      context: props.context,
      title: props.title || '',
      refreshPeriod: props.refreshPeriod || 0,
      selectedYouTrack,
      youTracks: [selectedYouTrack],
      filtersType: IssuesListEditForm.FILTERS_TYPES.PROJECTS
    };
    this.underlineAndSuggestDebouncer = new DebounceDecorator();
  }

  componentDidMount() {
    this.loadYouTrackList();
    this.onAfterYouTrackChanged();
  }

  setFormLoaderEnabled(isLoading) {
    this.setState({isLoading});
    if (isLoading) {
      this.setState({noConnection: false});
    }
  }

  async loadYouTrackList() {
    const {selectedYouTrack} = this.state;
    const youTracks = await ServiceResources.getYouTrackServices(
      this.props.dashboardApi, MIN_YOUTRACK_VERSION
    );
    const selectedYouTrackWithAllFields = youTracks.
      filter(yt => yt.id === selectedYouTrack.id)[0];
    this.setState({
      youTracks, selectedYouTrack: selectedYouTrackWithAllFields
    });
  }

  async onAfterYouTrackChanged() {
    this.setFormLoaderEnabled(true);
    try {
      await this.loadAllContexts();
    } catch (err) {
      this.setState({
        isLoading: false,
        errorMessage: HttpErrorHandler.getMessage(
          err,
          i18n('Selected YouTrack service is not available')
        )
      });
      return;
    }
    this.setFormLoaderEnabled(false);
  }

  changeFiltersType = filtersType =>
    this.setState({filtersType});

  changeSearch = search => {
    this.setState({search, errorMessage: ''});
  };

  appendToSearch = (filterType, filter) => {
    const {search, context} = this.state;
    if (!search && !context) {
      this.setState({context: filter});
    } else {
      const trimmedSearch = (search || '').replace(/\s+$/g, '');
      const newSearch = trimmedSearch ? `${trimmedSearch} ${filter.query}` : `${filter.query}`;
      this.setState({search: newSearch});
    }
  };

  changeTitle = evt =>
    this.setState({title: evt.target.value});

  clearTitle = () => this.setState({title: ''});

  changeYouTrack = selected => {
    this.setState({
      selectedYouTrack: selected.model,
      errorMessage: ''
    }, () => this.onAfterYouTrackChanged());
  };

  submitForm = async () => {
    const {
      search, context, title, refreshPeriod, selectedYouTrack
    } = this.state;
    this.setFormLoaderEnabled(true);
    try {
      await loadIssues(
        async (url, params) => this.fetchYouTrack(url, params), search, context
      );
    } catch (err) {
      this.setState({
        isLoading: false,
        errorMessage: HttpErrorHandler.getMessage(err)
      });
      return;
    }
    this.setFormLoaderEnabled(false);
    await this.props.onSubmit({
      search: search || '', title, context, refreshPeriod, selectedYouTrack
    });
  };

  fetchYouTrack = async (url, params) => {
    const {dashboardApi} = this.props;
    const {selectedYouTrack} = this.state;
    return await dashboardApi.fetch(selectedYouTrack.id, url, params);
  };

  underlineAndSuggest = async (query, caret, folder) =>
    // eslint-disable-next-line max-len
    this.underlineAndSuggestDebouncer.decorate(() => underlineAndSuggest(this.fetchYouTrack, query, caret, folder));

  queryAssistDataSource = async queryAssistModel =>
    await this.underlineAndSuggest(
      queryAssistModel.query, queryAssistModel.caret, this.state.context
    );

  changeSearchContext = selected => this.setState({context: selected.model});

  loadAllContexts = async () => {
    this.setState({allContexts: null});
    const allContexts = await loadPinnedIssueFolders(this.fetchYouTrack, true);
    this.setState({allContexts});
  };

  onQueryAssistInputChange = queryAssistModel =>
    this.changeSearch(queryAssistModel.query);

  onChangeRefreshPeriod = newValue =>
    this.setState({refreshPeriod: newValue});

  getAppendToQueryCallback = (filterType, filter) =>
    () => this.appendToSearch(filterType, filter);

  renderFilterLink(filterType, filter) {
    return (
      <div
        key={`filter-${filter.id}`}
        className="issues-list-widget__filter"
      >
        <Link
          pseudo
          onClick={this.getAppendToQueryCallback(filterType, filter)}
        >
          {
            filter.shortName
              ? `${filter.name} (${filter.shortName})`
              : filter.name
          }
        </Link>
      </div>
    );
  }

  renderFiltersList(filtersType) {
    const {allContexts, context, search} = this.state;

    const checkFilterType = (stringType, folder) =>
      (folder.$type || '').toLowerCase().indexOf(stringType) > -1;
    const isProject = checkFilterType.bind(null, 'project');
    const isTag = checkFilterType.bind(null, 'tag');
    const isSavedSearch = checkFilterType.bind(null, 'savedquery');

    const filterTypeCheckers = [
      isProject, isTag, isSavedSearch
    ];

    const noFiltersMessages = [
      i18n('No projects'),
      i18n('No tags'),
      i18n('No saved searches')
    ];

    const displayedFilters = (allContexts || []).
      filter(filterTypeCheckers[filtersType]).
      filter(filterIsNotAlreadyUsed);

    return (
      <div className="issues-list-widget__filters-list">
        {
          (!allContexts) && <LoaderInline/>
        }
        {
          displayedFilters.length === 0 &&
        (
          <span className="issues-list-widget__no-filters">
            {noFiltersMessages[filtersType]}
          </span>
        )
        }
        {
          displayedFilters.length > 0 && displayedFilters.map(
            filter => this.renderFilterLink(filtersType, filter)
          )
        }
      </div>
    );

    // eslint-disable-next-line complexity
    function filterIsNotAlreadyUsed(filter) {
      if (filter.id === (context || {}).id) {
        return false;
      }
      const trimmedSearch = (search || '').replace(/\s+$/g, '');
      const startPosition = trimmedSearch.indexOf(filter.query);
      if (startPosition === -1) {
        return true;
      }
      const endPosition = startPosition + filter.query.length;
      if (startPosition !== 0 && trimmedSearch[startPosition - 1] !== ' ') {
        return true;
      }
      return !(endPosition === trimmedSearch.length ||
        trimmedSearch[endPosition] === ' ');
    }
  }

  renderFilteringSettings() {
    const {
      search,
      context,
      filtersType,
      allContexts
    } = this.state;

    const toSelectItem = it => it && {key: it.id, label: it.name, model: it};

    const contextOptions = (allContexts || []).map(toSelectItem);
    contextOptions.unshift(IssuesListEditForm.EVERYTHING_CONTEXT_OPTION);

    return (
      <div>
        <div>
          <Select
            className="issues-list-widget__search-context"
            type={Select.Type.BUTTON}
            size={InputSize.S}
            data={contextOptions}
            selected={toSelectItem(context)}
            onSelect={this.changeSearchContext}
            filter
            loading={!allContexts}
            label={i18n('Everything')}
          />
          <div className="issues-list-widget__search-query">
            <QueryAssist
              disabled={this.state.isLoading}
              query={search}
              placeholder={i18n('Type search query')}
              onChange={this.onQueryAssistInputChange}
              dataSource={this.queryAssistDataSource}
            />
          </div>
        </div>
        <div className="issues-list-widget__filters-switcher">
          <Tabs
            selected={`${filtersType}`}
            onSelect={this.changeFiltersType}
          >
            <Tab
              id={`${IssuesListEditForm.FILTERS_TYPES.PROJECTS}`}
              title={i18n('Projects')}
            >
              {this.renderFiltersList(filtersType)}
            </Tab>
            <Tab
              id={`${IssuesListEditForm.FILTERS_TYPES.TAGS}`}
              title={i18n('Tags')}
            >
              {this.renderFiltersList(filtersType)}
            </Tab>
            <Tab
              id={`${IssuesListEditForm.FILTERS_TYPES.SEARCHES}`}
              title={i18n('Saved searches')}
            >
              {this.renderFiltersList(filtersType)}
            </Tab>
          </Tabs>
        </div>
      </div>
    );
  }

  renderRefreshPeriod() {
    if (this.state.isLoading || this.state.errorMessage) {
      return '';
    }

    return (
      <RefreshPeriod
        seconds={this.state.refreshPeriod}
        onChange={this.onChangeRefreshPeriod}
      />
    );
  }

  render() {
    const {
      youTracks,
      selectedYouTrack,
      noConnection,
      errorMessage,
      allContexts
    } = this.state;

    const youTrackServiceToSelectItem = it => it && {
      key: it.id,
      label: it.name,
      description: it.homeUrl,
      model: it
    };

    return (
      <ConfigurationForm
        warning={errorMessage}
        isInvalid={!!errorMessage}
        isLoading={this.state.isLoading}
        panelControls={this.renderRefreshPeriod()}
        onSave={this.submitForm}
        onCancel={this.props.onCancel}
      >
        <Input
          className="ring-form__group"
          borderless
          size={InputSize.FULL}
          value={this.state.title}
          placeholder={i18n('Set optional title')}
          onClear={this.clearTitle}
          onChange={this.changeTitle}
        />
        {
          youTracks.length > 1 &&
        (
          <Select
            size={InputSize.FULL}
            type={Select.Type.BUTTON}
            data={youTracks.map(youTrackServiceToSelectItem)}
            selected={youTrackServiceToSelectItem(selectedYouTrack)}
            onSelect={this.changeYouTrack}
            filter
            label={i18n('Select YouTrack')}
          />
        )
        }
        <div className="ring-form__group">
          {
            !noConnection && allContexts && this.renderFilteringSettings()
          }
          {
            !noConnection && !allContexts && !errorMessage && <LoaderInline/>
          }
        </div>
      </ConfigurationForm>
    );
  }
}


export default IssuesListEditForm;

/* eslint-disable max-len */
/* eslint-disable complexity */
/* eslint-disable react/no-access-state-in-setstate */
import React from 'react';
import PropTypes from 'prop-types';
import LoaderInline from '@jetbrains/ring-ui/components/loader-inline/loader-inline';
import PermissionCache from '@jetbrains/ring-ui/components/permissions/permissions__cache';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import EmptyWidget, {EmptyWidgetFaces} from '@jetbrains/hub-widget-ui/dist/empty-widget';
import ConfigurableWidget from '@jetbrains/hub-widget-ui/dist/configurable-widget';
import {Calendar} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import './style/calendar.scss';

import classNames from 'classnames';

import styles from './app.module.css';
import EditForm from './edit-form';
import {
  loadIssues,
  loadTotalIssuesCount,
  loadProfile,
  loadConfigL10n,
  updateIssueScheduleField,
  loadPermissionCache
} from './resources';
import ServiceResource from './components/service-resource';
import customMoment from './custom-localizer';
import EventComponent from './issue_event';
import CalendarToolbar from './calendar_toolbar';

const DragAndDropCalendar = withDragAndDrop(Calendar);
const DEFAULT_SCHEDULE_FIELD = 'Due Date';
const DEFAULT_COLOR_FIELD = 'Priority';
const DATE_FIELD_TYPE = 'date';
const DATE_AND_TIME_FIELD_TYPE = 'date and time';
const STATE_FIELD_NAME = 'State';
const ASSIGNEE_FIELD_NAME = 'Assignee';
const MIDDAY = 12;

class DueDatesCalendarWidget extends React.Component {
  static DEFAULT_REFRESH_PERIOD = 240; // eslint-disable-line no-magic-numbers


  static digitToUnicodeSuperScriptDigit = digitSymbol => {
    const unicodeSuperscriptDigits = [
      0x2070, 0x00B9, 0x00B2, 0x00B3, 0x2074, // eslint-disable-line no-magic-numbers
      0x2075, 0x2076, 0x2077, 0x2078, 0x2079 // eslint-disable-line no-magic-numbers
    ];
    return String.fromCharCode(unicodeSuperscriptDigits[Number(digitSymbol)]);
  };

  static getIssueListLink = (homeUrl, context, search) => {
    let link = `${homeUrl}/`;
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
          if (predefinedYouTrack && predefinedYouTrack.id) {
            return predefinedYouTrack;
          }
          try {
            // TODO: pass min-required version here
            return await ServiceResource.getYouTrackService(
              dashboardApi.fetchHub.bind(dashboardApi)
            );
          } catch (err) {
            return null;
          }
        };

  static youTrackServiceNeedsUpdate = service => !service.name;

  static getDefaultWidgetTitle = () =>
    i18n('Due Date Calendar Widget');

  static getWidgetTitle =
      (search,
        context,
        title,
        issuesCount,
        youTrack,
        scheduleField,
        eventEndField) => {
        const issuesQuery = scheduleField === eventEndField
          ? `has: {${scheduleField}}`
          : `has: {${scheduleField}} and has: {${eventEndField}}`;

        let displayedTitle =
            title ||
            `${DueDatesCalendarWidget.getFullSearchPresentation(context, search)} ${issuesQuery}`;
        if (issuesCount) {
          const superScriptIssuesCount =
                `${issuesCount}`.split('').map(DueDatesCalendarWidget.digitToUnicodeSuperScriptDigit).join('');
          displayedTitle += ` ${superScriptIssuesCount}`;
        }
        return {
          text: displayedTitle,
          href: youTrack && DueDatesCalendarWidget.getIssueListLink(
            youTrack.homeUrl, context, `${search} ${issuesQuery}`
          )
        };
      };

  static propTypes = {
    dashboardApi: PropTypes.object,
    configWrapper: PropTypes.object,
    registerWidgetApi: PropTypes.func
  };


  constructor(props) {
    super(props);
    const {registerWidgetApi} = props;

    this.state = {
      isConfiguring: false,
      isLoading: true,
      events: [],
      date: new Date(),
      localizer: customMoment(moment)
    };

    registerWidgetApi({
      onConfigure: () => this.setState({
        isConfiguring: true,
        isLoading: false,
        isLoadDataError: false,
        isEmptyQueryResultError: false
      }),
      onRefresh: () => this.loadIssues()
    });
  }

  componentDidMount() {
    this.initialize(this.props.dashboardApi);
  }

  initialize = async dashboardApi => {
    this.setState({isLoading: true});
    await this.props.configWrapper.init();

    const youTrackService =
      await DueDatesCalendarWidget.getDefaultYouTrackService(
        dashboardApi, this.props.configWrapper.getFieldValue('youTrack')
      );


    if (this.props.configWrapper.isNewConfig()) {
      this.initializeNewWidget(youTrackService);
    } else {
      await this.initializeExistingWidget(youTrackService);
    }

    await this.setLocaleOptions();
  };

  async setLocaleOptions() {
    const profile = await loadProfile(this.fetchYouTrack);
    const firstDayOfWeek = profile.profiles.appearance.firstDayOfWeek;
    const profileLocale = profile.profiles.general.locale.locale;
    moment.locale('en-gb', {
      week: {
        dow: firstDayOfWeek
      }
    });
    this.setState({localizer: customMoment(moment), profileLocale});
  }


  initializeNewWidget(youTrackService) {
    if (youTrackService && youTrackService.id) {
      this.setState({
        isConfiguring: true,
        isNew: true,
        youTrack: youTrackService,
        isLoading: false
      });
    }
    this.setState({isLoadDataError: true, isLoading: false});
  }

  // eslint-disable-next-line complexity
  async initializeExistingWidget(youTrackService) {
    const search = this.props.configWrapper.getFieldValue('search');
    const context = this.props.configWrapper.getFieldValue('context');
    const refreshPeriod =
          this.props.configWrapper.getFieldValue('refreshPeriod');
    const title = this.props.configWrapper.getFieldValue('title');
    const view = this.props.configWrapper.getFieldValue('view');


    const scheduleField =
        this.props.configWrapper.getFieldValue('scheduleField') ||
        DEFAULT_SCHEDULE_FIELD;

    const eventEndField =
        this.props.configWrapper.getFieldValue('eventEndField') ||
        scheduleField;

    const colorField =
        this.props.configWrapper.getFieldValue('colorField') ||
        DEFAULT_COLOR_FIELD;

    const isDateAndTime =
        this.props.configWrapper.getFieldValue('isDateAndTime');

    const canResize = scheduleField !== eventEndField;

    this.setState({
      title,
      search: search || '',
      context,
      date: new Date(),
      view,
      scheduleField,
      eventEndField,
      isDateAndTime,
      colorField,
      canResize,
      refreshPeriod:
        refreshPeriod || DueDatesCalendarWidget.DEFAULT_REFRESH_PERIOD
    });
    await this.showListFromCache(search, context);

    if (youTrackService && youTrackService.id) {
      const onYouTrackSpecified = async () => {
        await this.loadIssues(search, context);
        this.setState({isLoading: false});
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

    if (DueDatesCalendarWidget.youTrackServiceNeedsUpdate(youTrackService)) {
      const {dashboardApi} = this.props;
      ServiceResource.getYouTrackService(
        dashboardApi.fetchHub.bind(dashboardApi),
        youTrackService.id
      ).then(
        updatedYouTrackService => {
          const shouldReSetYouTrack = updatedYouTrackService &&
            !DueDatesCalendarWidget.youTrackServiceNeedsUpdate(
              updatedYouTrackService
            ) && updatedYouTrackService.homeUrl !== homeUrl;
          if (shouldReSetYouTrack) {
            this.setYouTrack(
              updatedYouTrackService, onAfterYouTrackSetFunction
            );
            if (!this.state.isConfiguring) {
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
      search, title, context, refreshPeriod, selectedYouTrack,
      scheduleField, eventEndField, colorField, isDateAndTime
    } = formParameters;


    const effectiveEventEndField = eventEndField || scheduleField;
    this.setYouTrack(
      selectedYouTrack, async () => {
        this.setState(
          {search: search || '',
            context, title, scheduleField, eventEndField: effectiveEventEndField,
            refreshPeriod, colorField, isDateAndTime},
          async () => {
            await this.loadIssues();
            await this.props.configWrapper.replace({
              search,
              context,
              title,
              refreshPeriod,
              scheduleField,
              eventEndField: effectiveEventEndField,
              colorField,
              isDateAndTime,
              youTrack: {
                id: selectedYouTrack.id,
                homeUrl: selectedYouTrack.homeUrl
              }
            });
            // eslint-disable-next-line max-len
            const canResize = this.state.scheduleField !== this.state.eventEndField;
            this.setState(
              {isConfiguring: false, fromCache: false, isNew: false, canResize}
            );
          }
        );
      }
    );
  };

  cancelConfiguration = async () => {
    if (this.state.isNew) {
      await this.props.dashboardApi.removeWidget();
    } else {
      this.setState({isConfiguring: false});
      await this.props.dashboardApi.exitConfigMode();
      this.initialize(this.props.dashboardApi);
    }
  };

  initRefreshPeriod = newRefreshPeriod => {
    if (newRefreshPeriod !== this.state.refreshPeriod) {
      this.setState({refreshPeriod: newRefreshPeriod});
    }

    const millisInSec = 1000;
    setTimeout(async () => {
      const {
        isConfiguring,
        refreshPeriod,
        search,
        context,
        scheduleField,
        eventEndField
      } = this.state;
      if (!isConfiguring && refreshPeriod === newRefreshPeriod) {
        await this.loadIssues(search, context, scheduleField, eventEndField);
        this.initRefreshPeriod(refreshPeriod);
      }
    }, newRefreshPeriod * millisInSec);
  };

  fetchYouTrack = async (url, params) => {
    const {dashboardApi} = this.props;
    const {youTrack} = this.state;
    return await dashboardApi.fetch(youTrack.id, url, params);
  };

  fetchHub = async (url, params) => {
    const {dashboardApi} = this.props;
    return await dashboardApi.fetchHub(url, params);
  };

  renderConfiguration = () => (
    <div className={`issues-list-widget ${styles.widget}`}>
      <EditForm
        search={this.state.search}
        context={this.state.context}
        title={this.state.title}
        refreshPeriod={this.state.refreshPeriod}
        scheduleField={this.state.scheduleField || DEFAULT_SCHEDULE_FIELD}
        eventEndField={this.state.eventEndField ||
            this.state.scheduleField || DEFAULT_SCHEDULE_FIELD}
        colorField={this.state.colorField || DEFAULT_COLOR_FIELD}
        onSubmit={this.submitConfiguration}
        onCancel={this.cancelConfiguration}
        dashboardApi={this.props.dashboardApi}
        youTrackId={this.state.youTrack.id}
      />
    </div>
  );

  renderLoadDataError() {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.ERROR}
        message={i18n('Can\'t load information from service.')}
      />
    );
  }

  renderEmptyQueryResultError() {
    return (
      <EmptyWidget
        face={EmptyWidgetFaces.ERROR}
        message={i18n('No issues corresponding your query, project and schedule field.')}
      />
    );
  }

  async loadIssues(search, context, scheduleField, eventEndField) {
    const currentSearch = search || this.state.search;
    const currentContext = context || this.state.context;
    const currentScheduleField = scheduleField || this.state.scheduleField;
    const currentEventEndField = eventEndField || this.state.eventEndField;
    try {
      const issuesQuery = currentScheduleField === currentEventEndField
        ? `has: {${currentScheduleField}}`
        : `has: {${currentScheduleField}} and has: {${currentEventEndField}}`;
      await this.loadIssuesCount(`${currentSearch} ${issuesQuery}`, currentContext);
    } catch (error) {
      this.setState({isEmptyQueryResultError: true, issuesCount: 0});
    }

    try {
      await this.loadIssuesUnsafe(
        currentSearch,
        currentContext,
        currentScheduleField,
        currentEventEndField);
    } catch (error) {
      this.setState({isLoadDataError: true});
    }
    await this.setLocaleOptions();

  }

  renderLoader() {
    return <LoaderInline/>;
  }


  async loadIssuesUnsafe(search, context, scheduleField, eventEndField) {

    const currentDate = moment(this.state.date);
    const startDate = moment(currentDate).startOf('month').startOf('week').format('YYYY-MM-DD');
    const endDate = moment(currentDate).endOf('month').endOf('week').format('YYYY-MM-DD');
    const searchPrefix = search && search.trim() ? `${search} AND` : '';
    const issuesQuery = scheduleField === eventEndField
      ? `${searchPrefix} ${scheduleField}: ${startDate} .. ${endDate}`
      : `${searchPrefix} ((${scheduleField}: ${startDate} .. ${endDate} or ${eventEndField}: ${startDate} .. ${endDate}) or (${scheduleField}: * .. ${startDate} and ${eventEndField}: ${endDate} .. *))`;

    const isDateAndTime = this.state.isDateAndTime;

    const issues = await loadIssues(
      this.fetchYouTrack, issuesQuery, context
    );

    const permCache = new PermissionCache(
      await loadPermissionCache(this.fetchHub));

    const events = [];
    if (Array.isArray(issues)) {


      issues.forEach(issue => {
        let issueScheduleField = '';
        let issueScheduleFieldDbId = '';
        let issueEventEndField = '';
        let issueEventEndFieldDbId = '';
        let issueAssignee = '';
        let foregroundColor = '#9c9c9c';
        let backgroundColor = '#e8e8e8';
        let issuePriority = '';
        let isResolved = false;
        const customFields = [];
        // eslint-disable-next-line complexity
        issue.fields.forEach(field => {
          if (field.hasOwnProperty('projectCustomField') && field.value) {
            const fieldType =
              field.projectCustomField.field.fieldType.valueType;
            // eslint-disable-next-line max-len
            if (fieldType === DATE_FIELD_TYPE && !isDateAndTime || fieldType === DATE_AND_TIME_FIELD_TYPE && isDateAndTime) {
              // eslint-disable-next-line max-len
              if (field.projectCustomField.field.name === scheduleField || field.projectCustomField.field.localizedName === scheduleField) {
                issueScheduleField = field.value;
                issueScheduleFieldDbId = field.id;
              }
              // eslint-disable-next-line max-len
              if (field.projectCustomField.field.name === eventEndField || field.projectCustomField.field.localizedName === eventEndField) {
                issueEventEndField = field.value;
                issueEventEndFieldDbId = field.id;
              }
            }
            // eslint-disable-next-line max-len
            if (field.projectCustomField.field.name === ASSIGNEE_FIELD_NAME || field.projectCustomField.field.localizedName === ASSIGNEE_FIELD_NAME) {
              issueAssignee = field.value;
            }

            // eslint-disable-next-line max-len
            if (field.projectCustomField.field.name === this.state.colorField || field.projectCustomField.field.localizedName === this.state.colorField) {
              issuePriority = field.value.name;
              foregroundColor = field.value.color.foreground;
              backgroundColor = field.value.color.background;
            } else if (field.value.color) {
              const prjCustomField = field.projectCustomField;
              customFields.push({
                name: prjCustomField.localizedName !== null
                  ? prjCustomField.localizedName
                  : prjCustomField.field.name,
                value: field.value.name,
                foregroundColor: field.value.color.foreground,
                backgroundColor: field.value.color.background
              });
            }

            if (field.projectCustomField.field.name === STATE_FIELD_NAME) {
              // eslint-disable-next-line max-len
              isResolved = Boolean(field.value.isResolved);
            }
          }
        });


        if (issueScheduleField !== '') {
          events.push({
            dbIssueId: issue.id,
            issueId: issue.idReadable,
            description: `${issue.idReadable} ${issue.summary}`,
            url: `${this.state.youTrack.homeUrl}/issue/${issue.idReadable}`,
            priority: issuePriority,
            isResolved,
            issueScheduleFieldDbId,
            // eslint-disable-next-line max-len
            issueEventEndFieldDbId: issueEventEndFieldDbId !== '' ? issueEventEndFieldDbId : issueScheduleFieldDbId,
            start: (new Date(issueScheduleField)),
            // eslint-disable-next-line max-len
            end: (issueEventEndField !== '' ? new Date(issueEventEndField) : new Date(issueScheduleField)),
            allDay: !this.state.isDateAndTime,
            foregroundColor,
            backgroundColor,
            customFields,
            issueAssignee,
            isUpdatable: permCache.has('JetBrains.YouTrack.UPDATE_ISSUE',
              issue.project.ringId),
            ytHomeUrl: this.state.youTrack.homeUrl
          });
        }
      });
    }
    this.setState({issues, events, fromCache: false, isLoadDataError: false});
    this.props.dashboardApi.storeCache({
      search, context, issues
    });
  }

  async loadIssuesCount(search, context) {
    const issuesCount =
      await loadTotalIssuesCount(
        this.fetchYouTrack, search, context
      );
    this.changeIssuesCount(issuesCount);
  }

  changeIssuesCount = issuesCount => {
    this.setState({issuesCount});
  };

  calendarNavigate = async date => {
    this.setState({date}, this.loadIssues);
    const config = await this.props.dashboardApi.readConfig();
    config.date = date;
    await this.props.dashboardApi.storeConfig(config);
  };

  calendarChangeView = async view => {
    this.setState({view});
    const config = await this.props.dashboardApi.readConfig();
    config.view = view;
    await this.props.dashboardApi.storeConfig(config);
  };

  // eslint-disable-next-line no-unused-vars
  handleSelect = async ({start, end}) => {
    const {
      context,
      isDateAndTime,
      youTrack,
      scheduleField
    } = this.state;

    const projectName = context.shortName;
    if (projectName) {
      let format = 'YYYY-MM-DD';
      if (isDateAndTime) {
        const l10nConfig = await loadConfigL10n(this.fetchYouTrack);
        const predefinedQueries = l10nConfig.l10n.predefinedQueries;
        const sep =
          predefinedQueries['DateTime Separator'] ? predefinedQueries['DateTime Separator'] : 'T';
        format = `YYYY-MM-DD[${sep}]HH:mm:ss`;
      }

      const slotTime = moment(start).format(format);

      window.open(
        `${youTrack.homeUrl}/newIssue?project=${encodeURIComponent(projectName)}&c=${encodeURIComponent(scheduleField)} ${slotTime}`);
    }
  };

  moveEvent = async ({event, start}) => {
    const {events} = this.state;
    const prevEvents = events;
    //calculate correct end to avoid issue with event prolongation on drag
    const newEnd =
      event.end.getTime() + start.getTime() - event.start.getTime();

    const idx = events.indexOf(event);
    const updatedEvent = {...event, start, end: new Date(newEnd)};
    const updatedEvents = [...events];
    updatedEvents.splice(idx, 1, updatedEvent);
    this.setState({
      events: updatedEvents
    });

    try {
      // update start date
      const newStartTime = this.state.isDateAndTime ? start.getTime() : toUtcMidday(start);
      await updateIssueScheduleField(
        this.fetchYouTrack,
        event.dbIssueId,
        event.issueScheduleFieldDbId,
        newStartTime);
      // update event end date if field different
      if (event.issueEventEndFieldDbId !== event.issueScheduleFieldDbId) {
        await updateIssueScheduleField(
          this.fetchYouTrack,
          event.dbIssueId,
          event.issueEventEndFieldDbId,
          newEnd);
      }
    } catch (error) {
      this.setState({
        events: prevEvents
      });
    }
  }

  resizeEvent = async ({event, start, end}) => {
    const {events} = this.state;
    const prevEvents = events;
    const idx = events.indexOf(event);
    const updatedEvent = {...event, start, end};
    const updatedEvents = [...events];
    updatedEvents.splice(idx, 1, updatedEvent);
    this.setState({
      events: updatedEvents
    });

    try {
      const newStartTime = this.state.isDateAndTime ? start.getTime() : toUtcMidday(start);
      // update start date
      await updateIssueScheduleField(
        this.fetchYouTrack,
        event.dbIssueId,
        event.issueScheduleFieldDbId,
        newStartTime);
      // update event end date if field different
      if (event.issueEventEndFieldDbId !== event.issueScheduleFieldDbId) {
        const newEndTime = this.state.isDateAndTime ? end.getTime() : toUtcMidday(new Date(end));
        await updateIssueScheduleField(
          this.fetchYouTrack,
          event.dbIssueId,
          event.issueEventEndFieldDbId,
          newEndTime);
      }
    } catch (error) {
      this.setState({
        events: prevEvents
      });
    }
  }

  eventUpdatable = event => event.isUpdatable
  canResize = () => this.state.canResize

  // eslint-disable-next-line complexity
  renderContent = () => {
    const {
      isConfiguring,
      isLoading,
      fromCache,
      isLoadDataError,
      isEmptyQueryResultError
    } = this.state;

    if (isEmptyQueryResultError) {
      return this.renderEmptyQueryResultError();
    }

    if (isLoadDataError && !fromCache) {
      return this.renderLoadDataError();
    }

    if (isConfiguring) {
      return this.renderConfiguration();
    }

    if (isLoading && !fromCache) {
      return this.renderLoader();
    }

    const calendarClasses = classNames({
      [`${styles.calendar}`]: true,
      'date-only-calendar': !this.state.isDateAndTime
    });

    return (
      <div className={styles.widget}>
        <DragAndDropCalendar
          selectable
          localizer={this.state.localizer}
          defaultDate={this.state.date}
          defaultView={this.state.view}
          events={this.state.events}
          draggableAccessor={this.eventUpdatable}
          onEventDrop={this.moveEvent}
          onEventResize={this.resizeEvent}
          resizableAccessor={this.canResize}
          className={calendarClasses}
          views={['month', 'week', 'day']}
          culture={this.state.profileLocale}
          components={
            {
              toolbar: CalendarToolbar,
              event: EventComponent
            }
          }
          onNavigate={this.calendarNavigate}
          onView={this.calendarChangeView}
          onSelectSlot={this.handleSelect}
          messages={{
            showMore: total => `+ ${total} ${i18n('more')}`
          }}
        />
      </div>
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
      youTrack,
      scheduleField,
      eventEndField
    } = this.state;

    const widgetTitle = isConfiguring
      ? DueDatesCalendarWidget.getDefaultWidgetTitle()
      : DueDatesCalendarWidget.getWidgetTitle(
        search,
        context,
        title,
        issuesCount,
        youTrack,
        scheduleField,
        eventEndField
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

function toUtcMidday(date) {
  // eslint-disable-next-line max-len
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), MIDDAY, 0, 0, 0);
}


export default DueDatesCalendarWidget;

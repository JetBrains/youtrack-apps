import 'babel-polyfill';
import DashboardAddons from 'hub-dashboard-addons';
import React from 'react';
import {render} from 'react-dom';

import DueDatesCalendarWidget from './due_dates_calendar_widget';
import ConfigWrapper from './config-wrapper';
import {initTranslations} from './translations';

const CONFIG_FIELDS = [
  'search', 'context', 'title', 'refreshPeriod', 'youTrack', 'date', 'view', 'scheduleField', 'colorField', 'isDateAndTime', 'eventEndField'
];

DashboardAddons.registerWidget(async (dashboardApi, registerWidgetApi) => {
  initTranslations(DashboardAddons.locale);
  const configWrapper = new ConfigWrapper(dashboardApi, CONFIG_FIELDS);

  render(
    <DueDatesCalendarWidget
      dashboardApi={dashboardApi}
      configWrapper={configWrapper}
      registerWidgetApi={registerWidgetApi}
    />,
    document.getElementById('app-container')
  );
});

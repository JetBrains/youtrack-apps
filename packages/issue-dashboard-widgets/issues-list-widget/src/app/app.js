import 'babel-polyfill';
import 'hub-dashboard-addons/dashboard.css';

import React from 'react';
import {render} from 'react-dom';
import DashboardAddons from 'hub-dashboard-addons';
import ConfigWrapper from '@jetbrains/hub-widget-ui/dist/config-wrapper';

import IssuesListWidget from './issues-list-widget';
import {initTranslations} from './translations';

const CONFIG_FIELDS = [
  'search', 'context', 'title', 'refreshPeriod', 'youTrack'
];

DashboardAddons.registerWidget(async (dashboardApi, registerWidgetApi) => {
  initTranslations(DashboardAddons.locale);
  const configWrapper = new ConfigWrapper(dashboardApi, CONFIG_FIELDS);

  render(
    <IssuesListWidget
      dashboardApi={dashboardApi}
      configWrapper={configWrapper}
      registerWidgetApi={registerWidgetApi}
      editable={DashboardAddons.editable}
    />,
    document.getElementById('app')
  );
});

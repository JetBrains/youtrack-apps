import 'babel-polyfill';
import DashboardAddons from 'hub-dashboard-addons';
import React from 'react';
import {Provider} from 'react-redux';
import {render} from 'react-dom';

import '@jetbrains/ring-ui/components/form/form.scss';
import createStore from './ReduxStore';

import WidgetContainer from './WidgetContainer';
import HubService from './HubService';
import {initTranslations} from './translations';


DashboardAddons.registerWidget((dashboardApi, registerWidgetApi) => {
  initTranslations(DashboardAddons.locale);
  registerWidgetApi({});

  const store = createStore();
  const hubService = new HubService(dashboardApi.fetchHub);

  return render(
    <Provider store={store}>
      <WidgetContainer hubService={hubService}/>
    </Provider>,
    document.getElementById('app-container')
  );
});

import 'babel-polyfill';
import {mount} from 'enzyme';
import React from 'react';

import ActivitiesWidget from '../app/activities-widget';

import filter from '../app/activities-filter';

import {
  getDashboardApiMock, getRegisterWidgetApiMock
} from './mocks';

describe('ActivitiesWidget', () => {

  let dashboardApiMock;
  let registerWidgetApiMock;

  beforeEach(() => {
    dashboardApiMock = getDashboardApiMock();
    registerWidgetApiMock = getRegisterWidgetApiMock();
    filter.youTrackId = '1-1';
    filter.youTrackUrl = 'localhost';
  });

  it('should export ActivitiesWidget', () => {
    (ActivitiesWidget).should.be.a('function');
  });

  const mountActivitiesWidget = () =>
    mount(
      <ActivitiesWidget
        dashboardApi={dashboardApiMock}
        registerWidgetApi={registerWidgetApiMock}
      />
    );

  it('should create component', () => {
    const widgetInstance = mountActivitiesWidget().instance();

    (widgetInstance).should.be.an('object');
    (widgetInstance.state.isLoading).should.equal(false);
    (widgetInstance.state.isConfiguring).should.equal(false);
  });

  it('should register widget api during initialization', () => {
    (registerWidgetApiMock).should.not.be.called();

    mountActivitiesWidget();

    (registerWidgetApiMock).should.be.called();
  });
});

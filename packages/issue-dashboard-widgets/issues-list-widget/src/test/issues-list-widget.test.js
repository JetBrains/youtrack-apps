import 'babel-polyfill';
import {mount} from 'enzyme';
import React from 'react';

import IssuesListWidget from '../app/issues-list-widget';

import {
  getDashboardApiMock, getRegisterWidgetApiMock
} from './mocks';

describe('IssuesListWidget', () => {

  let dashboardApiMock;
  let registerWidgetApiMock;

  beforeEach(() => {
    dashboardApiMock = getDashboardApiMock();
    registerWidgetApiMock = getRegisterWidgetApiMock();
  });

  it('should export IssuesListWidget', () => {
    (IssuesListWidget).should.be.a('function');
  });

  const mountIssueListWidget = () =>
    mount(
      <IssuesListWidget
        dashboardApi={dashboardApiMock}
        registerWidgetApi={registerWidgetApiMock}
      />
    );

  it('should create component', () => {
    const widgetInstance = mountIssueListWidget().instance();

    (widgetInstance).should.be.an('object');
    (widgetInstance.state.isLoading).should.be.equal(true);
    (widgetInstance.state.isConfiguring).should.be.equal(false);
  });

  it('should register widget api during initialization', () => {
    (registerWidgetApiMock).should.not.be.called();

    mountIssueListWidget();

    (registerWidgetApiMock).should.be.called();
  });
});

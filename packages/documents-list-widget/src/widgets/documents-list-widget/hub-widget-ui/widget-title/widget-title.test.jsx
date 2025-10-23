/* eslint-disable no-unused-expressions */

import React from 'react';
import {expect} from 'chai';
import {render, screen} from '@testing-library/react/dist/@testing-library/react.pure.umd';

import TestComponent from '../test-mocks/test-component.js';
import {getDashboardApiMock} from '../test-mocks/test-mocks.js';

import withWidgetTitleHOC from './widget-title.jsx';

describe('WidgetTitle', () => {

  let dashboardApiMock;
  let TitleTestComponent;

  beforeEach(() => {
    document.body.innerHTML = '';

    dashboardApiMock = getDashboardApiMock();
    TitleTestComponent = withWidgetTitleHOC(TestComponent);
  });

  it('should export function', () => {
    expect(withWidgetTitleHOC).to.be.a('function');
  });

  it('should render component wrapped to title-hoc', () => {
    mountTitleTestComponent('World', 'Hello', dashboardApiMock);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('World');
  });

  it('should set title for dashboard api', () => {
    mountTitleTestComponent('World', 'Hello', dashboardApiMock);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('World');

    expect(dashboardApiMock.setTitle).to.have.been.called;
  });

  it('should not update title for dashboard api if it was not changed', () => {
    const {rerender} = mountTitleTestComponent('World', 'Hello', dashboardApiMock);

    expect(dashboardApiMock.setTitle).to.have.been.calledOnce;

    mountTitleTestComponent('Updated label', 'Hello', dashboardApiMock, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');

    expect(dashboardApiMock.setTitle).to.have.been.calledOnce;
  });

  it('should not update title for dashboard api if passed same value', () => {
    const {rerender} = mountTitleTestComponent('World', 'Hello', dashboardApiMock);

    expect(dashboardApiMock.setTitle).to.have.been.calledOnce;

    mountTitleTestComponent('Updated label', 'Hello', dashboardApiMock, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');
    expect(dashboardApiMock.setTitle).to.have.been.calledOnce;
  });

  it('should update title for dashboard api if it was changed', () => {
    const {rerender} = mountTitleTestComponent('World', 'Hello', dashboardApiMock);

    expect(dashboardApiMock.setTitle).to.have.been.calledOnce;

    mountTitleTestComponent('Updated label', {
      text: 'Hello',
      link: 'http://google.com'
    }, dashboardApiMock, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');
    expect(dashboardApiMock.setTitle).to.have.been.calledTwice;
  });

  it('should work even without title-hoc parameters', () => {
    const {rerender} = mountTitleTestComponent('World');

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('World');

    mountTitleTestComponent('Updated label', undefined, undefined, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');
  });

  function mountTitleTestComponent(label, widgetTitle, dashboardApi, renderFunction = render) {
    return renderFunction(
      <TitleTestComponent
        label={label}
        widgetTitle={widgetTitle}
        dashboardApi={dashboardApi}
      />
    );
  }
});

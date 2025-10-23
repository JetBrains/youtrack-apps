/* eslint-disable no-unused-expressions */

import React from 'react';
import {expect} from 'chai';
import {render, screen} from '@testing-library/react/dist/@testing-library/react.pure.umd';

import TestComponent from '../test-mocks/test-component.js';
import {getDashboardApiMock} from '../test-mocks/test-mocks.js';

import withWidgetLoaderHOC from './widget-loader.jsx';

describe('WidgetLoader', () => {

  let dashboardApiMock;
  let WidgetLoaderTestComponent;

  beforeEach(() => {
    document.body.innerHTML = '';

    dashboardApiMock = getDashboardApiMock();
    WidgetLoaderTestComponent = withWidgetLoaderHOC(TestComponent);
  });

  it('should export function', () => {
    expect(withWidgetLoaderHOC).to.be.a('function');
  });

  it('should render component wrapped to counter-loader-hoc', () => {
    mountWidgetLoaderTestComponent('World', true, dashboardApiMock);

    expect(screen.getByTestId('test-component-root').innerText).is.equal('World');
  });

  it('should set counter-loader animation for dashboard api', () => {
    const {rerender} = mountWidgetLoaderTestComponent('World', true, dashboardApiMock);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('World');

    expect(dashboardApiMock.setLoadingAnimationEnabled).to.have.been.called;

    mountWidgetLoaderTestComponent('Updated label', true, dashboardApiMock, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');
  });

  it('should not update counter-loader animation state for dashboard api if it was not changed', () => {
    const {rerender} = mountWidgetLoaderTestComponent('World', true, dashboardApiMock);

    expect(dashboardApiMock.setLoadingAnimationEnabled).to.have.been.calledOnce;

    mountWidgetLoaderTestComponent('Updated label', true, dashboardApiMock, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');
    expect(dashboardApiMock.setLoadingAnimationEnabled).to.have.been.calledOnce;
  });

  it('should not update counter-loader animation state for dashboard api if passed same value', () => {
    const {rerender} = mountWidgetLoaderTestComponent('World', true, dashboardApiMock);

    expect(dashboardApiMock.setLoadingAnimationEnabled).to.have.been.calledOnce;

    mountWidgetLoaderTestComponent('Updated label', true, dashboardApiMock, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');
    expect(dashboardApiMock.setLoadingAnimationEnabled).to.have.been.calledOnce;
  });

  it('should update counter-loader animation state for dashboard api if it was changed', () => {
    const {rerender} = mountWidgetLoaderTestComponent('World', true, dashboardApiMock);

    expect(dashboardApiMock.setLoadingAnimationEnabled).to.have.been.calledOnce;

    mountWidgetLoaderTestComponent('Updated label', false, dashboardApiMock, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');
    expect(dashboardApiMock.setLoadingAnimationEnabled).to.have.been.calledTwice;
  });

  it('should work even without widget-counter-loader-hoc parameters', () => {
    const {rerender} = mountWidgetLoaderTestComponent('World');

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('World');

    mountWidgetLoaderTestComponent('Updated label', undefined, undefined, rerender);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('Updated label');
  });


  function mountWidgetLoaderTestComponent(
    label, widgetLoader, dashboardApi, renderFunction = render
  ) {
    return renderFunction(
      <WidgetLoaderTestComponent
        label={label}
        widgetLoader={widgetLoader}
        dashboardApi={dashboardApi}
      />
    );
  }
});

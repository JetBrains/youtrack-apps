/* eslint-disable no-unused-expressions */

import React from 'react';
import sinon from 'sinon';
import {expect} from 'chai';
import {render, screen} from '@testing-library/react/dist/@testing-library/react.pure.umd';

import TestComponent from '../test-mocks/test-component.js';

import withTimerHOC from './timer.jsx';

describe('WidgetLoader', () => {

  const TEST_PERIOD = 100;

  let WidgetTimerTestComponent;
  let onTick;
  let clock;

  beforeEach(() => {
    onTick = sandbox.spy();
    clock = sinon.useFakeTimers();
    WidgetTimerTestComponent = withTimerHOC(TestComponent);
  });

  afterEach(() => {
    clock.restore();
  });

  it('should export function', () => {
    expect(withTimerHOC).to.be.a('function');
  });

  it('should render component wrapped to timer-hoc', () => {
    mountTimerTestComponent('World', TEST_PERIOD, onTick);

    expect(
      screen.getByTestId('test-component-root').innerText
    ).to.equal('World');
  });


  it('should not call onTick immediately', () => {
    mountTimerTestComponent('World', TEST_PERIOD, onTick);

    expect(onTick).not.to.have.been.called;
  });

  it('should call onTick right after period ended', () => {
    mountTimerTestComponent('World', TEST_PERIOD, onTick);
    clock.tick(TEST_PERIOD + 1);

    expect(onTick).have.been.calledOnce;
  });

  it('should change ticking interval', () => {
    const {rerender} = mountTimerTestComponent('World', TEST_PERIOD, onTick);
    mountTimerTestComponent('World', TEST_PERIOD + TEST_PERIOD, onTick, rerender);

    clock.tick(TEST_PERIOD + 1);
    expect(onTick).not.to.have.been.called;

    clock.tick(TEST_PERIOD + 1);
    expect(onTick).have.been.calledOnce;
  });

  it('should change ticking interval even when period was updated with delay', () => {
    const {rerender} = mountTimerTestComponent('World', TEST_PERIOD, onTick);

    clock.tick(TEST_PERIOD + 1);
    expect(onTick).have.been.calledOnce;

    mountTimerTestComponent('World', TEST_PERIOD + TEST_PERIOD, onTick, rerender);

    clock.tick(TEST_PERIOD + 1);
    expect(onTick).have.been.calledOnce;

    clock.tick(TEST_PERIOD + 1);
    expect(onTick).have.been.calledTwice;
  });

  function mountTimerTestComponent(label, period, onTickCallback, renderFunction = render) {
    return renderFunction(
      <WidgetTimerTestComponent
        label={label}
        tickPeriod={period}
        onTick={onTickCallback}
      />
    );
  }
});

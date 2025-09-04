/* eslint-disable no-undef */
import sinon from 'sinon';
import chai from 'chai';
import spies from 'chai-spies';
import chaiAsPromised from 'chai-as-promised';
import chaiDOM from 'chai-dom';
import sinonChai from 'sinon-chai';
import {configure} from '@testing-library/react/dist/@testing-library/react.pure.umd';

chai.use(spies);
chai.use(chaiAsPromised);
chai.use(chaiDOM);
chai.use(sinonChai);

configure({testIdAttribute: 'data-test'});


Object.assign(window, {
  sandbox: sinon.createSandbox()
});

export function getDashboardApiMock() {
  return {
    fetch: sandbox.spy(),
    fetchHub: sandbox.spy(),
    readConfig: sandbox.spy(),
    setLoadingAnimationEnabled: sandbox.spy(),
    storeConfig: sandbox.spy(),
    exitConfigMode: sandbox.spy(),
    setTitle: sandbox.spy()
  };
}

export function getRegisterWidgetApiMock() {
  return sandbox.spy();
}

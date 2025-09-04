/* eslint-disable no-unused-expressions */
import {expect} from 'chai';

import {getDashboardApiMock} from '../test-mocks/test-mocks.js';

import ConfigWrapper from './config-wrapper.js';

describe('ConfigWrapper', () => {
  let configWrapper;
  let dashboardApi;

  beforeEach(() => {
    dashboardApi = getDashboardApiMock();
    configWrapper = new ConfigWrapper(dashboardApi, ['youTrack', 'title']);
  });

  it('should export interface', () => {
    expect(configWrapper.init).to.be.a('function');
    expect(configWrapper.isInitialized).to.be.a('function');
    expect(configWrapper.isNewConfig).to.be.a('function');
    expect(configWrapper.getFieldValue).to.be.a('function');
    expect(configWrapper.update).to.be.a('function');
    expect(configWrapper.replace).to.be.a('function');
  });

  it('should not be initialized by default', () => {
    expect(configWrapper.isInitialized()).to.equal(false);

    expect(dashboardApi.readConfig).to.not.have.been.called;
  });

  it('should read config on initialization', () => {
    configWrapper.init();

    expect(dashboardApi.readConfig).to.have.been.called;
  });

});

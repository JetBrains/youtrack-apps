import chai from 'chai';

export function getDashboardApiMock() {
  return {
    fetch: chai.spy(),
    fetchHub: chai.spy(),
    readConfig: chai.spy(),
    setLoadingAnimationEnabled: chai.spy(),
    storeConfig: chai.spy(),
    exitConfigMode: chai.spy(),
    setTitle: chai.spy()
  };
}

export function getRegisterWidgetApiMock() {
  return chai.spy();
}

export function getFilterMock() {
  return chai.spy();
}

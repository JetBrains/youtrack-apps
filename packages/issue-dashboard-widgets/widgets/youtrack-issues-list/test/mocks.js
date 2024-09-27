import chai from 'chai';
import chaiEnzyme from 'chai-enzyme';
import spies from 'chai-spies';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

const adapter = new Adapter();
Enzyme.configure({adapter});

chai.use(chaiEnzyme());
chai.use(spies);

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

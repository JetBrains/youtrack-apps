// chai-as-promised uses es6
import 'core-js/es6';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiDOM from 'chai-dom';
import sinonChai from 'sinon-chai';
import spies from 'chai-spies';
import chaiEnzyme from 'chai-enzyme';
import sinon from 'sinon';
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';

Enzyme.configure({adapter: new Adapter()});

chai.use(chaiAsPromised);
chai.use(chaiDOM);
chai.use(sinonChai);
chai.use(chaiEnzyme());
chai.use(spies);

Object.assign(window, {
  sinon,
  chai,
  should: chai.should()
});

const testsContext = require.context('./widgets', true, /\.test\.js$/);
testsContext.keys().forEach(testsContext);

import PropTypes from 'prop-types';
import React from 'react';

import './test-mocks.js';

const TestComponent = ({label, onRender}) => {
  if (onRender) {
    onRender();
  }
  return (
    <span data-test="test-component-root">
      {label}
    </span>
  );
};

TestComponent.propTypes = {
  label: PropTypes.string,
  onRender: PropTypes.func
};

TestComponent.defaultProps = {
  label: 'Test'
};

export default TestComponent;

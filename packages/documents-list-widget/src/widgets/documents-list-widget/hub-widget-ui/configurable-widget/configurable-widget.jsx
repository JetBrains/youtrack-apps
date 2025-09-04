import React from 'react';
import PropTypes from 'prop-types';

import withConfigurationModeHOC from '../configuration-mode/configuration-mode.jsx';
import withWidgetTitleHOC from '../widget-title/widget-title.jsx';


const ConfigurableWidget =
  ({isConfiguring, Configuration, Content}) => (isConfiguring ? <Configuration/> : <Content/>);

ConfigurableWidget.propTypes = {
  isConfiguring: PropTypes.bool.isRequired,
  dashboardApi: PropTypes.object.isRequired,
  // React component
  Configuration: PropTypes.func.isRequired,
  // React component
  Content: PropTypes.func.isRequired
};

export default withConfigurationModeHOC(withWidgetTitleHOC(ConfigurableWidget));

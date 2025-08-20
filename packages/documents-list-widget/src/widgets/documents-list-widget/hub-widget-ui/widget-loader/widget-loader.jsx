import React from 'react';
import PropTypes from 'prop-types';

function withWidgetLoaderHOC(WrappedComponent) {

  return class WidgetLoader extends React.Component {

    static propTypes = {
      widgetLoader: PropTypes.bool,
      dashboardApi: PropTypes.object
    };

    static getDerivedStateFromProps(props, state) {
      if ((!!props.widgetLoader) !== !!(state.prevWidgetLoader)) {
        return {
          prevWidgetLoader: props.widgetLoader,
          shouldLoaderUpdate: true
        };
      }
      return {
        prevWidgetTitle: state.prevWidgetLoader,
        shouldLoaderUpdate: false
      };
    }

    constructor(props) {
      super(props);
      this.state = {};
    }

    render() {
      const {widgetLoader, ...restProps} = this.props;

      if (this.state.shouldLoaderUpdate && restProps.dashboardApi) {
        restProps.dashboardApi.setLoadingAnimationEnabled(widgetLoader);
      }

      return (
        <WrappedComponent {...restProps}/>
      );
    }
  };
}

export default withWidgetLoaderHOC;

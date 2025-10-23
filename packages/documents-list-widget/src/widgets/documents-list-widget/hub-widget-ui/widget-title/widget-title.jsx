import React, {Component} from 'react';
import PropTypes from 'prop-types';

import toSuperDigitsString from '../super-digits/super-digits.js';

function withWidgetTitleHOC(WrappedComponent) {

  const widgetTitleAsObject = widgetTitle =>
    (typeof widgetTitle === 'string'
      ? {text: widgetTitle, counter: -1, href: null}
      : widgetTitle);

  const shouldTitleUpdate = (currentTitle, prevTitle) => {
    if (!currentTitle || currentTitle === prevTitle) {
      return false;
    }

    const {
      text: oldText, counter: oldCounter, href: oldHref
    } = widgetTitleAsObject(prevTitle || {});
    const {
      text: newText, counter: newCounter, href: newHref
    } = widgetTitleAsObject(currentTitle || {});
    return oldText !== newText || oldCounter !== newCounter || oldHref !== newHref;
  };

  const updateTitle = (widgetTitle, dashboardApi) => {
    const {text, counter, href} = widgetTitleAsObject(widgetTitle);

    const superDigitTitlePart = counter != null && counter >= 0
      ? ` ${toSuperDigitsString(counter)}`
      : '';
    dashboardApi.setTitle(`${text}${superDigitTitlePart}`, href);
  };

  return class WidgetTitle extends Component {

    static propTypes = {
      widgetTitle: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
      ]),
      dashboardApi: PropTypes.object
    };

    static getDerivedStateFromProps(props, state) {
      if (shouldTitleUpdate(props.widgetTitle, state.prevWidgetTitle)) {
        updateTitle(props.widgetTitle, props.dashboardApi);
        return {
          prevWidgetTitle: props.widgetTitle
        };
      }
      return {
        prevWidgetTitle: state.prevWidgetTitle
      };
    }

    constructor(props) {
      super(props);
      this.state = {};
    }

    render() {
      const {widgetTitle, ...restProps} = this.props; // eslint-disable-line no-unused-vars

      return (
        <WrappedComponent {...restProps}/>
      );
    }
  };
}

export default withWidgetTitleHOC;

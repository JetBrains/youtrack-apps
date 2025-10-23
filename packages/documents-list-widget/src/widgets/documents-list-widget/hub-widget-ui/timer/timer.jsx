import React from 'react';
import PropTypes from 'prop-types';

function withTimerHOC(WrappedComponent) {

  return class Timer extends React.Component {

    static propTypes = {
      tickPeriod: PropTypes.number,
      onTick: PropTypes.func
    };

    static getDerivedStateFromProps(props, state) {
      if (props.tickPeriod !== state.prevTickPeriod) {
        return {
          prevTickPeriod: props.tickPeriod,
          reSchedule: true
        };
      }
      return {
        prevTickPeriod: state.prevtickPeriod,
        reSchedule: false
      };
    }

    constructor(props) {
      super(props);
      this.state = {};
    }

    componentDidMount() {
      this.schedule();
    }

    componentDidUpdate() {
      if (this.state.reSchedule) {
        this.cancel();
        this.schedule();
      }
    }

    componentWillUnmount() {
      this.cancel();
    }

    handler = null;

    task = () => {
      if (this.props.onTick && !document.hidden) {
        this.props.onTick();
      }
      this.schedule();
    };

    schedule = () => {
      if (this.props.tickPeriod) {
        this.handler = setTimeout(this.task, this.props.tickPeriod);
      } else {
        this.handler = null;
      }
    };

    cancel = () => {
      if (this.handler) {
        clearTimeout(this.handler);
        this.handler = null;
      }
    };

    render() {
      return <WrappedComponent {...this.props}/>;
    }
  };
}

export default withTimerHOC;

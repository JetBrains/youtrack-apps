import React from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDownIcon, ChevronRightIcon
} from '@jetbrains/ring-ui/components/icon';

class ChevronToggle extends React.Component {

  static propTypes = {
    label: PropTypes.string,
    color: PropTypes.object,
    onToggle: PropTypes.func
  };

  constructor(props) {
    super(props);
    this.toggleExpanded = this.toggleExpanded.bind(this);
    this.state = {
      expanded: false
    };
  }

  toggleExpanded() {
    const oldValue = this.state.expanded;
    this.setState({expanded: !oldValue});
    this.props.onToggle(!oldValue);
  }

  renderChevron(expanded, color) {
    return expanded ? (
      <ChevronDownIcon
        size={ChevronDownIcon.Size.Size14}
        color={color}
        onClick={this.toggleExpanded}
      />
    ) : (
      <ChevronRightIcon
        size={ChevronRightIcon.Size.Size14}
        color={color}
        onClick={this.toggleExpanded}
      />
    );
  }

  render() {
    const {label, color} = this.props;
    const {expanded} = this.state;
    return (
      <a
        className="aw__toggle"
        onClick={this.toggleExpanded}
      >
        {this.renderChevron(expanded, color || ChevronDownIcon.Color.BLUE)}
        {label &&
          (
            <span className="aw__toggle__text">
              {label}
            </span>
          )
        }
      </a>
    );
  }
}


export default ChevronToggle;

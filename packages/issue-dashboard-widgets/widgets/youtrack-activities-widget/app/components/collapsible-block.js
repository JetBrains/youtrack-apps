import React from 'react';
import PropTypes from 'prop-types';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import ChevronToggle from './chevron-toggle';

class CollapsibleBlock extends React.Component {

  static propTypes = {
    children: PropTypes.node,
    fieldName: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.toggleExpanded = this.toggleExpanded.bind(this);
    this.state = {
      expanded: false
    };
  }


  toggleExpanded(newValue) {
    this.setState({expanded: newValue});
  }

  render() {
    const {fieldName, children} = this.props;
    const {expanded} = this.state;
    return (
      <div className="aw__collapsible-block">
        <div>
          <span className="aw__activity__text__field-name">
            {`${fieldName}:`}
          </span>
          <ChevronToggle
            label={i18n('Details')}
            onToggle={this.toggleExpanded}
          />
        </div>
        <div className="aw__activity__text__value">
          {expanded && children}
        </div>
      </div>
    );
  }
}


export default CollapsibleBlock;

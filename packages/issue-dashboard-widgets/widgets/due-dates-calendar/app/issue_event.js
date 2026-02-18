import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Dropdown from '@jetbrains/ring-ui/components/dropdown/dropdown';
import Popup from '@jetbrains/ring-ui/components/popup/popup';


class EventComponent extends React.Component {
  static propTypes = {
    event: PropTypes.object
  };


  renderColorField = () => {
    const event = this.props.event;
    if (event.priority) {
      const colorsStyle = {
        backgroundColor: event.backgroundColor,
        color: event.foregroundColor
      };
      return (
        <div className={'popup-color-scheme-field'} style={colorsStyle}>
          {`${event.priority.charAt(0).toUpperCase()}`}
        </div>
      );
    } else {
      return '';
    }
  };

  renderAssignee = () => {

    const assignee = this.props.event.issueAssignee;
    const ringId = assignee.ringId;

    if (ringId) {
      const assigneeHomeUrl = `${this.props.event.ytHomeUrl}/users/${ringId}`;
      return (
        <a href={assigneeHomeUrl}>
          <img
            src={assignee.avatarUrl}
            title={assignee.name}
          />
        </a>
      );
    } else {
      return ('');
    }
  };

  renderDescription() {
    const event = this.props.event;
    return (
      <div className={'popup-body'}>
        <div className={'popup-header'}>
          {this.renderColorField()}
          <div className={'popup-header-text'}>{event.description}</div>
        </div>
        <div className={'popup-customfields-block'}>
          {this.renderCustomFields()}
        </div>
      </div>
    );
  }

  renderCustomFields = () => {
    const customFields = [];
    const eventCustomFields = this.props.event.customFields;

    customFields.push(<div key={'popup-assignee'} className={'popup-assignee'}>
      {this.renderAssignee()}
    </div>);

    for (let i = 0; i < eventCustomFields.length; i++) {
      const customField = eventCustomFields[i];
      const colorsStyle = {
        backgroundColor: customField.backgroundColor

      };
      customFields.push(
        <div key={customField.name} className={'custom-field-block'}>
          <div className={'custom-field-value'}>
            <div className={'custom-field-icon'} style={colorsStyle}/>
            <div title={customField.name}>{customField.value}</div>
          </div>
        </div>);
    }
    return customFields;
  };

  renderAnchor() {
    const classes = classNames({
      'event-link': true,
      'event-resolved': this.props.event.isResolved
    });

    const event = this.props.event;
    const colorsStyle = {
      backgroundColor: event.backgroundColor,
      color: event.foregroundColor,
      borderColor: event.foregroundColor
    };

    return (
      <div className={'event-container'} style={colorsStyle} title={''}>
        <a
          className={classes}
          style={colorsStyle}
          href={this.props.event.url}
        >
          {this.props.event.description}
        </a>
      </div>
    );
  }

  render() {
    return (
      <Dropdown
        className={'issue-dropdown'}
        anchor={this.renderAnchor()}
        clickMode={false}
        hoverMode
      >
        <Popup
          className={'issue-popup'}
        >
          {this.renderDescription()}
        </Popup>
      </Dropdown>
    );
  }
}

export default EventComponent;

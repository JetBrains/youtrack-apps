import React from 'react';

import Input, {Size as InputSize} from '@jetbrains/ring-ui/components/input/input';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import '@jetbrains/ring-ui/components/form/form.scss';

import './style/activities-widget.css';
import filter from './activities-filter';

class EditFormOptionalTitle extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      title: filter.title || ''
    };
  }

  clearTitle = () => {
    this.setState({title: ''});
    filter.title = null;
  };

  changeTitle = evt => {
    const newTitle = evt.target.value;
    if (newTitle && newTitle.length === 0) {
      this.clearTitle();
    } else {
      this.setState({title: newTitle});
      filter.title = newTitle;
    }
  };

  render() {
    const {title} = this.state;

    return (
      <Input
        className="aw__optional-title"
        size={InputSize.FULL}
        value={title}
        label={i18n('Set optional title')}
        onClear={this.clearTitle}
        onChange={this.changeTitle}
      />
    );
  }
}


export default EditFormOptionalTitle;

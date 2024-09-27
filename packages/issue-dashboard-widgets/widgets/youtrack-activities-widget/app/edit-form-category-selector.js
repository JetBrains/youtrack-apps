import React from 'react';

import Table from '@jetbrains/ring-ui/components/table/table';
import Selection from '@jetbrains/ring-ui/components/table/selection';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import filter from './activities-filter';
import {CATEGORIES} from './components/categories';
import './style/activities-widget.css';

class EditFormCategorySelector extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      data: CATEGORIES.sort((a, b) => a.name.localeCompare(b.name)),
      selection: new Selection({
        data: CATEGORIES,
        selected: this.toSelected(filter.categoriesIds)
      })
    };
  }

  toSelected = categoriesIds => {
    let selected;
    if (categoriesIds) {
      selected = CATEGORIES.filter(it => categoriesIds.indexOf(it.id) >= 0);
    } else {
      selected = CATEGORIES;
    }
    return new Set(selected);
  };

  fromSelected = selected => [...selected].map(it => it.id);

  onSelect = newSelection => {
    this.setState({selection: newSelection});
    filter.categoriesIds = this.fromSelected(newSelection.getSelected());
  };

  columns = [
    {
      id: 'name',
      title: i18n('Category')
    }
  ];

  render() {
    const {data, selection} = this.state;
    return (
      <div className="aw__category-selector">
        <div className="aw__category-selector__title">
          {i18n('Activity Categories')}
        </div>
        <div className="aw__category-selector__info">
          {i18n('Select which types of updates are shown in the activity feed')}
        </div>
        <Table
          data={data}
          columns={this.columns}
          selection={selection}
          onSelect={this.onSelect}
          selectable
        />
      </div>
    );
  }
}


export default EditFormCategorySelector;

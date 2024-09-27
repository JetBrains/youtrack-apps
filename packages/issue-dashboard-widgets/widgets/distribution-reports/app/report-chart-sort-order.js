import React from 'react';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';
import {ChevronDownIcon} from '@jetbrains/ring-ui/components/icon';
import {RerenderableSelect} from '@jetbrains/ring-ui/components/select/select';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import DistributionReportAxises from './distribution-report-axises';

class ReportChartSortOrder extends React.Component {

  static Orientation = {
    Vertical: 0,
    Horizontal: 1
  };

  static Arrows = {
    Vertical: {
      Asc: '↓',
      Desc: '↑'
    },
    Horizontal: {
      Asc: '⟶',
      Desc: '⟵'
    }
  };

  static sortOrderToSelectOption = (sortOrder, orientation) => ({
    key: sortOrder,
    label: `${ReportChartSortOrder.getArrow(sortOrder, orientation)} ${ReportChartSortOrder.getSortOrderTypePresentation(sortOrder)}`,
    description: sortOrder.indexOf('ASC') > -1 ? i18n('asc') : i18n('desc'),
    model: sortOrder
  });

  static getSortOrderSelectOptions = orientation =>
    DistributionReportAxises.SortOrder.All.map(sortOrder =>
      ReportChartSortOrder.sortOrderToSelectOption(sortOrder, orientation));

  static getSortOrderTypePresentation = sortOrder => (
    (sortOrder === DistributionReportAxises.SortOrder.ByCount.Asc ||
      sortOrder === DistributionReportAxises.SortOrder.ByCount.Desc)
      ? i18n('by count')
      : i18n('natural')
  );

  static getArrow = (sortOrder, orientation) => {
    const arrowsRelatedToOrientation =
      (orientation === ReportChartSortOrder.Orientation.Vertical
        ? ReportChartSortOrder.Arrows.Vertical
        : ReportChartSortOrder.Arrows.Horizontal);

    if (sortOrder === DistributionReportAxises.SortOrder.ByCount.Asc ||
      sortOrder === DistributionReportAxises.SortOrder.Naturally.Asc) {
      return arrowsRelatedToOrientation.Asc;
    }

    return arrowsRelatedToOrientation.Desc;
  };

  static propTypes = {
    sortOrder: PropTypes.string,
    orientation: PropTypes.number,
    disabled: PropTypes.bool,
    onChange: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      sortOrder: props.sortOrder,
      orientation: props.orientation,
      onChange: props.onChange,
      disabled: props.disabled
    };
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(props) {
    this.setState({
      sortOrder: props.sortOrder,
      orientation: props.orientation
    });
  }

  changeSortOrder = selected => {
    const {onChange} = this.state;
    const newSortOrder = selected.model || selected;

    this.setState({
      sortOrder: newSortOrder
    }, () => onChange && onChange(newSortOrder));
  };

  onRenderSortOrderSelector = sortOrderSelector => {
    this.sortOrderSelector = sortOrderSelector;
  };

  openSortOrderSelector = () => {
    if (this.sortOrderSelector) {
      this.sortOrderSelector._clickHandler();
    }
  };

  renderReadonly() {
    const {
      orientation,
      sortOrder
    } = this.state;

    return (
      <span>
        <span>
          {ReportChartSortOrder.getArrow(sortOrder, orientation)}
        </span>&nbsp;
        {ReportChartSortOrder.getSortOrderTypePresentation(sortOrder)}
      </span>
    );
  }

  renderEditable() {
    const {
      orientation,
      sortOrder
    } = this.state;

    const options = ReportChartSortOrder.getSortOrderSelectOptions(orientation).
      filter(option => option.model !== sortOrder);

    return (
      <span>
        <Link
          pseudo
          onClick={this.openSortOrderSelector}
        >
          <span>
            {ReportChartSortOrder.getArrow(sortOrder, orientation)}
          </span>&nbsp;
          {ReportChartSortOrder.getSortOrderTypePresentation(sortOrder)}
          <ChevronDownIcon
            size={ChevronDownIcon.Size.Size12}
          />
        </Link>
        <RerenderableSelect
          ref={this.onRenderSortOrderSelector}
          data={options}
          selected={ReportChartSortOrder.sortOrderToSelectOption(sortOrder)}
          filter
          onSelect={this.changeSortOrder}
          type={RerenderableSelect.Type.CUSTOM}
        />
      </span>
    );
  }

  render() {
    if (!this.state.sortOrder) {
      return (<span/>);
    }

    if (this.state.disabled) {
      return (
        this.renderReadonly()
      );
    }

    return (
      this.renderEditable()
    );
  }
}

export default ReportChartSortOrder;

import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import Link from '@jetbrains/ring-ui/components/link/link';

import FilterFieldValue from '../../../../lib/reporting-components/filter-field-value/filter-field-value';
import ReportModel from '../../../../lib/reporting-components/report-model/report-model';

import DistributionReportModel from './distribution-report-model';
import './nv-flex-pie-chart';

class MatrixPresentation extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    homeUrl: PropTypes.string,
    onActivateLine: PropTypes.func,
    onResetActiveLine: PropTypes.func,
    activeLineIdx: PropTypes.number
  };

  constructor(props) {
    super(props);

    this.state = {
      matrixModel: DistributionReportModel.getBarsChartModel(props.reportData)
    };
  }

  componentWillReceiveProps(props) {
    if (props.reportData) {
      this.setState({
        matrixModel: DistributionReportModel.getBarsChartModel(props.reportData)
      });
    }
  }

  clearActiveLineIndex = () => {
    if (this.props.onResetActiveLine) {
      this.props.onResetActiveLine();
    }
  };

  onActivateLine = lineIdx => {
    if (this.props.onActivateLine) {
      this.props.onActivateLine(lineIdx);
    }
  };

  renderTableCell(row, rowIdx) {
    const sizeValue = ReportModel.getSizeValue(
      row.size
    );
    const sizePresentation = sizeValue
      ? ReportModel.getSizePresentation(row.size)
      : '-';

    const onClick = () => {
      if (sizeValue) {
        const url = ReportModel.getSearchUrl(
          row.issuesQuery, this.props.homeUrl
        );
        window.open(url, '_blank');
      }
    };

    const onMouseOver = () =>
      this.onActivateLine(rowIdx);

    const isActiveIdx = this.props.activeLineIdx === rowIdx;

    return (
      <div
        key={`column-row-key-${rowIdx}`}
        className={`report-chart__table-cell${isActiveIdx ? ' report-chart__table-cell_active' : ''}`}
        onMouseOver={onMouseOver}
        onClick={onClick}
      >
        {
          (sizeValue > 0) &&
          <Link pseudo={true}>
            {sizePresentation}
          </Link>
        }
        {
          (sizeValue === 0) &&
          <span>{sizePresentation}</span>
        }
      </div>
    );
  }

  renderColumn(column) {
    return (
      <div
        key={`column-value-${column.name}`}
        className="report-chart__table-column"
      >
        {
          column.values.map((row, idx) =>
            this.renderTableCell(row, idx)
          )
        }
      </div>
    );
  }

  render() {
    const {matrixModel} = this.state;

    return (
      <div
        className="report-chart__body report-chart__body_matrix"
      >
        <div className="report-chart__table-header">
          {
            matrixModel.map(column => (
              <div
                key={`column-key-${column.name}`}
                className="report-chart__table-header-cell"
              >
                <FilterFieldValue
                  value={column}
                  homeUrl={this.props.homeUrl}
                />
              </div>
            ))
          }
        </div>
        <div
          className="report-chart__table"
          onMouseLeave={this.clearActiveLineIndex}
        >
          {
            matrixModel.map(column => this.renderColumn(column))
          }
        </div>
      </div>
    );
  }
}

export default MatrixPresentation;

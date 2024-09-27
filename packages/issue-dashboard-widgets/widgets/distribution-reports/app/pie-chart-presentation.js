import './style/report-chart.scss';

import React from 'react';
import PropTypes from 'prop-types';
import d3 from 'd3/d3';

import ReportModel from './../../../../lib/reporting-components/report-model/report-model';
import './nv-flex-pie-chart';
import DistributionReportModel from './distribution-report-model';

const nv = window.nv;

class PieChartPresentation extends React.Component {
  static propTypes = {
    reportData: PropTypes.object,
    homeUrl: PropTypes.string
  };

  constructor(props) {
    super(props);
    const {reportData} = props;

    this.state = {
      chartModel: DistributionReportModel.getPieChartModel(reportData),
      totalSize: ReportModel.getSizeValue(reportData.total)
    };
  }

  componentWillReceiveProps(props) {
    const {reportData} = props;
    if (reportData) {
      this.setState({
        chartModel: DistributionReportModel.getPieChartModel(reportData),
        totalSize: ReportModel.getSizeValue(reportData.total)
      }, () => this.drawPieChart());
    }
  }

  drawPieChart = () => {
    const pieChartNode = this.chartNode;
    if (!pieChartNode) {
      return;
    }

    const {chartModel, totalSize} = this.state;
    const toPercents = 100;
    const duration = 350;

    nv.addGraph(() => {
      const chart = nv.models.flexPieChart().
        x(d => d.name).
        y(d => d.size).
        valueFormat(value =>
          `${value} (${Math.round((value * toPercents) / totalSize)}%)`
        ).
        showLegend(false).
        showLabels(false);

      chart.getUrl(sector => ReportModel.getSearchUrl(
        (sector.data || {}).issuesQuery, this.props.homeUrl
      ));

      d3.select(pieChartNode).
        datum(chartModel).
        transition().
        duration(duration).
        call(chart);

      d3.select(pieChartNode).selectAll('a').attr('target', '_blank');

      nv.utils.windowResize(chart.update);

      return chart;
    });
  };

  onGetSvgNodeForPie = pieChartNode => {
    if (pieChartNode) {
      this.chartNode = pieChartNode;
      this.drawPieChart();
    }
  };

  render() {
    const verticalPadding = 65;
    const height = `${window.innerHeight - verticalPadding}px`;

    return (
      <div
        className="report-chart__body report-chart__body_fixed"
        style={{height}}
      >
        <svg width="100%" height="100%" ref={this.onGetSvgNodeForPie}/>
      </div>
    );
  }
}

export default PieChartPresentation;

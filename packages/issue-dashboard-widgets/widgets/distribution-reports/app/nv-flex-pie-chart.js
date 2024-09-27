nv.models.flexPie = function() {
  /*jshint ignore:start*/
  /*eslint-disable*/
  'use strict';
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
    , width = 500
    , height = 550
    , offset = 25
    , getX = function(d) { return d.x }
    , getY = function(d) { return d.y }
    , getDescription = function(d) { return d.description }
    , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
    , color = nv.utils.defaultColor()
    , valueFormat = d3.format(',.2f')
    , labelFormat = d3.format('%')
    , showLabels = true
    , pieLabelsOutside = true
    , donutLabelsOutside = false
    , labelThreshold = 0.1
    , labelType = "key"
    , donut = false
    , labelSunbeamLayout = false
    , startAngle = false
    , endAngle = false
    , donutRatio = 0.5
    , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout')
    , getUrl = null
  ;

  let zeroAngle = function (data) {
    const enabledData = data.filter(d => !d.disabled);
    const total = enabledData.reduce((a, b) => a + getY(b), 0);
    return total === 0 ? 0 : -2 * Math.PI * getY(enabledData[0]) / total;
  };

  //============================================================

  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right,
        availableHeight = height - margin.top - margin.bottom - (showLabels ? offset : 0),
        radius = Math.min(availableWidth, availableHeight) / 2,
        arcRadius = showLabels ? radius - (radius / 5) : radius,
        container = d3.select(this);
      var arc = d3.svg.arc()
        .outerRadius(arcRadius);

      // This does the normal label
      var labelsArc = d3.svg.arc().innerRadius(0);
      if (pieLabelsOutside){ labelsArc = arc; }
      if (donutLabelsOutside) { labelsArc = d3.svg.arc().outerRadius(arc.outerRadius()); }


      //------------------------------------------------------------
      // Util methods

      const utils = {};

      utils.getSector = function (d) {
        var sector = 3 * (d.startAngle + d.endAngle) / Math.PI; // 12 * ((a0 + a1) / 2) / (2 * pi)
        return sector < 0 ? 12 - (Math.abs(sector) % 12) : sector % 12;
      };

      utils.getPercent = function (d) {
        return (d.endAngle - d.startAngle) / (2 * Math.PI);
      };
      // Computes the angle of an arc, converting from radians to degrees.
      utils.angle = function(d) {
        var a = (d.startAngle + d.endAngle) * 90 / Math.PI - 90;
        return a > 90 ? a - 180 : a;
      };

      utils.arcTween = function(a) {
        a.endAngle = isNaN(a.endAngle) ? 0 : a.endAngle;
        a.startAngle = isNaN(a.startAngle) ? 0 : a.startAngle;
        if (!donut) a.innerRadius = 0;
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
          return arc(i(t));
        };
      };

      utils.tweenPie = function(b) {
        b.innerRadius = 0;
        var i = d3.interpolate({startAngle: 0, endAngle: 0}, b);
        return function(t) {
          return arc(i(t));
        };
      };

      utils.findTextAnchor = function(d) {
        var sector = utils.getSector(d);
        return sector < 6.0 ? 'start' : 'end';
      };

      utils.findTooltipGravity = function(d) {
        var sector = utils.getSector(d);
        if (labelSunbeamLayout) {
          return sector < 6.0 ? 'w' : 'e';
        } else {
          return (sector > 2.0 && sector < 4.0) ? 'w' :
            (sector >= 4.0 && sector <= 8.0) ? 'n' :
              (sector > 8.0 && sector < 10.0) ? 'e' : 's';
        }
      };

      utils.calculateTooltipPosition = function(d) {
        var a = (d.startAngle + d.endAngle) / 2;
        return [availableWidth / 2 + arcRadius * Math.sin(a) / 2, availableHeight / 2 - arcRadius * Math.cos(a) / 2]
      };

      if (showLabels) {
        utils.labelLocationCounter = new (function() {
          var labelLocationHash = {};
          var hideLabels = false;
          var avgHeight = 22;
          var hashKey = 0;
          var checkOverlapping = function(currentCenter, prevCenter) {
            return Math.abs(currentCenter[1] - prevCenter[1]) < avgHeight;
          };
          var createHashKeyY = function(coordinates) {
            return Math.floor(coordinates[1] / avgHeight / 2);
          };
          var makeLabelInsideVisibleArea = function(coordinates) {
            coordinates[1] = (coordinates[1] < 0) ? Math.max(coordinates[1], (avgHeight - height) / 2.0) : Math.min(coordinates[1], (height - avgHeight) / 2);
          };
          this.resetToInitialState = function() {
            labelLocationHash = {};
            hideLabels = false;
            hashKey = 0;
          };
          this.setLocation = function(d, group) {
            if (labelSunbeamLayout) {
              d.outerRadius = arcRadius + 10; // Set Outer Coordinate
              d.innerRadius = arcRadius + 15; // Set Inner Coordinate
              var rotateAngle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
              if ((d.startAngle + d.endAngle) / 2 < Math.PI) {
                rotateAngle -= 90;
              } else {
                rotateAngle += 90;
              }
              group.transition().attr('transform', 'translate(' + labelsArc.centroid(d) + ') rotate(' + rotateAngle + ')');
            } else {
              d.outerRadius = radius + 10; // Set Outer Coordinate
              d.innerRadius = radius + 15; // Set Inner Coordinate

              if (d.value) {
                hideLabels = hideLabels || ((d.endAngle - d.startAngle) < labelThreshold);
                if (hideLabels) {
                  group.attr('opacity', 0.0);
                } else {
                  var center = labelsArc.centroid(d);
                  var sector = utils.getSector(d);
                  if (labelLocationHash[hashKey] && sector > 6.0 && sector < 6.3 && labelLocationHash[hashKey].sector < 6.0 && labelLocationHash[hashKey].sector > 5.7) {
                    center[1] = Math.max(labelLocationHash[hashKey].center[1], center[1]);
                  }
                  hashKey = createHashKeyY(center);
                  if (labelLocationHash[hashKey] && checkOverlapping(center, labelLocationHash[hashKey].center) && (sector > 6.0) == (labelLocationHash[hashKey].sector > 6.0)) {
                    if (sector > 6.0 && labelLocationHash[hashKey].sector < sector) {
                      center[1] = labelLocationHash[hashKey].center[1] - avgHeight;
                    } else {
                      center[1] = labelLocationHash[hashKey].center[1] + avgHeight;
                    }
                    makeLabelInsideVisibleArea(center);
                    hashKey = createHashKeyY(center);
                    if (hashKey in labelLocationHash && checkOverlapping(center, labelLocationHash[hashKey].center)) {
                      group.attr('opacity', 0.0);
                      hideLabels = true;
                    }
                  }
                  if (!hideLabels) {
                    makeLabelInsideVisibleArea(center);
                    group.transition().attr('transform', 'translate(' + center + ')');
                    group.attr('opacity', 1.0);
                    labelLocationHash[hashKey] = {
                      sector: sector,
                      center: center
                    };
                  }
                }
              }
            }
          };
        })();
      }
      // end of utils
      //============================================================


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      //var wrap = container.selectAll('.nv-wrap.nv-pie').data([data]);
      var wrap = container.selectAll('.nv-wrap.nv-pie').data(data);
      var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-pie nv-chart-' + id);
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-pie');
      gEnter.append('g').attr('class', 'nv-pieLabels');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      g.select('.nv-pie').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');
      g.select('.nv-pieLabels').attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');

      //------------------------------------------------------------


      container
        .on('click', function(d,i) {
          dispatch.chartClick({
            data: d,
            index: i,
            pos: d3.event,
            id: id
          });
        });

      if (startAngle) arc.startAngle(startAngle);
      if (endAngle) arc.endAngle(endAngle);
      if (donut) arc.innerRadius(radius * donutRatio);

      // Setup the Pie chart and choose the data element
      var pie = d3.layout.pie()
        .sort(null)
        .startAngle(zeroAngle)
        .endAngle(function () {
          return (typeof zeroAngle === "function" ? zeroAngle.apply(this, arguments) : zeroAngle) + 2 * Math.PI;
        })
        .value(function(d) { return d.disabled ? 0 : getY(d) });

      var slices = wrap.select('.nv-pie').selectAll('.nv-slice')
        .data(pie);

      var pieLabels = wrap.select('.nv-pieLabels').selectAll('.nv-label')
        .data(pie);

      slices.exit().remove();
      pieLabels.exit().remove();

      var slicesEnter = slices.enter();
      if (getUrl) {
        slicesEnter = slicesEnter.append('a')
          .attr('xlink:href', function(d, i) {
            return getUrl(d, i);
          });
      }

      var ae = slicesEnter.append('g')
        .attr('class', 'nv-slice')
        .on('mouseover', function(d,i){
          d3.select(this).classed('hover', true);
          dispatch.elementMouseover({
            label: getX(d.data),
            value: getY(d.data),
            point: d.data,
            pointIndex: i,
            pos: utils.calculateTooltipPosition(d),
            gravity: utils.findTooltipGravity(d),
            id: id
          });
        })
        .on('mouseout', function(d,i){
          d3.select(this).classed('hover', false);
          dispatch.elementMouseout({
            label: getX(d.data),
            value: getY(d.data),
            point: d.data,
            index: i,
            id: id
          });
        })
        .on('click', function(d,i) {
          dispatch.elementClick({
            label: getX(d.data),
            value: getY(d.data),
            point: d.data,
            index: i,
            pos: d3.event,
            id: id
          });
          d3.event.stopPropagation();
        })
        .on('dblclick', function(d,i) {
          dispatch.elementDblClick({
            label: getX(d.data),
            value: getY(d.data),
            point: d.data,
            index: i,
            pos: d3.event,
            id: id
          });
          d3.event.stopPropagation();
        });

      slices
        .attr('fill', function(d,i) { return color(d, i); })
        .attr('stroke', function(d,i) { return color(d, i); });

      var paths = ae.append('path')
        .each(function(d) { this._current = d; });
      //.attr('d', arc);

      slices.select('path')
        .transition()
        .attr('d', arc)
        .attrTween('d', utils.arcTween);

      if (showLabels) {
        pieLabels.enter().append("g").classed("nv-label", true).each(function (d, i) {
          var group = d3.select(this);

          group.attr('transform', function (d) {
            if (labelSunbeamLayout) {
              d.outerRadius = arcRadius + 8; // Set Outer Coordinate
              d.innerRadius = arcRadius + 16; // Set Inner Coordinate
              var rotateAngle = (d.startAngle + d.endAngle) / 2 * (180 / Math.PI);
              if ((d.startAngle + d.endAngle) / 2 < Math.PI) {
                rotateAngle -= 90;
              } else {
                rotateAngle += 90;
              }
              return 'translate(' + labelsArc.centroid(d) + ') rotate(' + rotateAngle + ')';
            } else {
              d.outerRadius = radius + 8; // Set Outer Coordinate
              d.innerRadius = radius + 16; // Set Inner Coordinate
              return 'translate(' + labelsArc.centroid(d) + ')'
            }
          });

          group.append('rect')
            .style('stroke', '#fff')
            .style('fill', '#fff')
            .attr('rx', 3)
            .attr('ry', 3);

          group.append('text')
            .style('text-anchor', utils.findTextAnchor(d));

        });

        pieLabels.transition().each(function(d, i) {
          if (i == 0) {
            utils.labelLocationCounter.resetToInitialState();
          }
          utils.labelLocationCounter.setLocation(d, d3.select(this));
        });

        pieLabels.select('.nv-label text')
          .style('text-anchor',
            function(d, i) {
              return utils.findTextAnchor(d);
            })
          .text(function(d, i) {
            var percent = utils.getPercent(d);
            var labelTypes = {
              "key" : getX(d.data),
              "value": getY(d.data),
              "percent": labelFormat(percent)
            };
            return d.value ? labelTypes[labelType] : '';
          });
      }
    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.values = function(_) {
    nv.log("pie.values() is no longer supported.");
    return chart;
  };

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = d3.functor(_);
    return chart;
  };

  chart.description = function(_) {
    if (!arguments.length) return getDescription;
    getDescription = _;
    return chart;
  };

  chart.showLabels = function(_) {
    if (!arguments.length) return showLabels;
    showLabels = _;
    return chart;
  };

  chart.labelSunbeamLayout = function(_) {
    if (!arguments.length) return labelSunbeamLayout;
    labelSunbeamLayout = _;
    return chart;
  };

  chart.donutLabelsOutside = function(_) {
    if (!arguments.length) return donutLabelsOutside;
    donutLabelsOutside = _;
    return chart;
  };

  chart.pieLabelsOutside = function(_) {
    if (!arguments.length) return pieLabelsOutside;
    pieLabelsOutside = _;
    return chart;
  };

  chart.labelType = function(_) {
    if (!arguments.length) return labelType;
    labelType = _;
    labelType = labelType || "key";
    return chart;
  };

  chart.donut = function(_) {
    if (!arguments.length) return donut;
    donut = _;
    return chart;
  };

  chart.donutRatio = function(_) {
    if (!arguments.length) return donutRatio;
    donutRatio = _;
    return chart;
  };

  chart.startAngle = function(_) {
    if (!arguments.length) return startAngle;
    startAngle = _;
    return chart;
  };

  chart.endAngle = function(_) {
    if (!arguments.length) return endAngle;
    endAngle = _;
    return chart;
  };

  chart.zeroAngle = function(_) {
    if (!arguments.length) return zeroAngle;
    zeroAngle = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.valueFormat = function(_) {
    if (!arguments.length) return valueFormat;
    valueFormat = _;
    return chart;
  };

  chart.labelFormat = function(_) {
    if (!arguments.length) return labelFormat;
    labelFormat = _;
    return chart;
  };

  chart.labelThreshold = function(_) {
    if (!arguments.length) return labelThreshold;
    labelThreshold = _;
    return chart;
  };

  chart.getUrl = function(_){
    if (!arguments.length) return getUrl;
    getUrl = _;
    return chart;
  };
  //============================================================


  return chart;
};

nv.models.flexPieChart = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var pie = nv.models.flexPie()
    , legend = nv.models.legend()
  ;

  var margin = {top: 30, right: 20, bottom: 20, left: 20}
    , width = null
    , height = null
    , showLegend = true
    , color = nv.utils.defaultColor()
    , tooltips = true
    , tooltipContent = function(key, y, e, graph) {
      return '<h3>' + key + '</h3>' +
        '<p>' +  y + '</p>'
    }
    , state = {}
    , defaultState = null
    , noData = "No Data Available."
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState')
  ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement) {
    var tooltipLabel = pie.description()(e.point) || pie.x()(e.point);
    var left = e.pos[0] + margin.left + ( (offsetElement && offsetElement.offsetLeft) || 0 ),
      top = e.pos[1] + margin.top + ( (offsetElement && offsetElement.offsetTop) || 0),
      y = pie.valueFormat()(pie.y()(e.point)),
      content = tooltipContent(tooltipLabel, y, e, chart);

    nv.tooltip.show([left, top], content, e.gravity, 0, offsetElement);
  };

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
        that = this;

      var availableWidth = (width || parseInt(container.style('width')) || 960)
        - margin.left - margin.right,
        availableHeight = (height || parseInt(container.style('height')) || 400)
          - margin.top - margin.bottom;

      chart.update = function() { container.transition().call(chart); };
      chart.container = this;

      //set state.disabled
      state.disabled = data.map(function(d) { return !!d.disabled });

      if (!defaultState) {
        var key;
        defaultState = {};
        for (key in state) {
          if (state[key] instanceof Array)
            defaultState[key] = state[key].slice(0);
          else
            defaultState[key] = state[key];
        }
      }

      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!data || !data.length) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight / 2)
          .text(function(d) { return d });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-pieChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-pieChart').append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-pieWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Legend

      if (showLegend) {
        legend
          .width( availableWidth )
          .key(pie.x());

        wrap.select('.nv-legendWrap')
          .datum(data)
          .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight = (height || parseInt(container.style('height')) || 400)
            - margin.top - margin.bottom;
        }

        wrap.select('.nv-legendWrap')
          .attr('transform', 'translate(0,' + (-margin.top) +')');
      }

      //------------------------------------------------------------


      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      //------------------------------------------------------------
      // Main Chart Component(s)

      pie
        .width(availableWidth)
        .height(availableHeight);


      var pieWrap = g.select('.nv-pieWrap')
        .datum([data]);

      d3.transition(pieWrap).call(pie);

      //------------------------------------------------------------


      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      legend.dispatch.on('stateChange', function(newState) {
        state = newState;
        dispatch.stateChange(state);
        chart.update();
      });

      pie.dispatch.on('elementMouseout.tooltip', function(e) {
        dispatch.tooltipHide(e);
      });

      dispatch.on('tooltipShow', function(e) {
        if (tooltips) showTooltip(e, that.parentNode);
      });

      // Update chart from a state object passed to event handler
      dispatch.on('changeState', function(e) {

        if (typeof e.disabled !== 'undefined') {
          data.forEach(function(series,i) {
            series.disabled = e.disabled[i];
          });

          state.disabled = e.disabled;
        }

        chart.update();
      });

      //============================================================


    });

    return chart;
  }

  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  pie.dispatch.on('elementMouseover.tooltip', function(e) {
    dispatch.tooltipShow(e);
  });

  dispatch.on('tooltipHide', function() {
    if (tooltips) nv.tooltip.cleanup();
  });

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.legend = legend;
  chart.dispatch = dispatch;
  chart.pie = pie;

  d3.rebind(chart, pie, 'valueFormat', 'labelFormat', 'values', 'x', 'y', 'description', 'id', 'showLabels', 'donutLabelsOutside', 'pieLabelsOutside', 'labelType', 'donut', 'donutRatio', 'zeroAngle', 'labelThreshold', 'getUrl');
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    legend.color(color);
    pie.color(color);
    return chart;
  };

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltipContent;
    tooltipContent = _;
    return chart;
  };

  chart.state = function(_) {
    if (!arguments.length) return state;
    state = _;
    return chart;
  };

  chart.defaultState = function(_) {
    if (!arguments.length) return defaultState;
    defaultState = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  //============================================================


  return chart;
  /*eslint-disable*/
  /*jshint ignore:end*/
};

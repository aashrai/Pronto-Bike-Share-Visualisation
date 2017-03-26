var mapboxTiles = L.tileLayer('https://api.mapbox.com/styles/v1/aashrai/cj0ig5xgr00gj2srl2y632rmr/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWFzaHJhaSIsImEiOiJjaXp2Z2N2NWswMTI2MzNuaDdtMHE3MHEyIn0.2Y4IHW4OXer-0xb8LtxuWA', {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
  });

var map = L.map('map', {
        'scrollWheelZoom': false,
        'zoomControl': false
      })
    .addLayer(mapboxTiles)
    .setView([47.635, -122.284], 13);
mapboxTiles.on('load', function() {
    setTimeout(function() {
        drawStations();
        drawHeader();
        drawPaths('trip_date_max.csv');

      }, 600);
  });

/* Initialize the SVG layer */
map._initPathRoot();

/* We simply pick up the SVG from the map object */
var svg = d3.select('#map').select('svg');
var g = svg.append('g');
var timeFormat = d3.time.format('%m/%d/%Y %H:%M');

var toggleText = 'See Weekday';

function drawHeader() {
  svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('height', 60)
      .attr('width', d3.select('#map').node().getBoundingClientRect().width)
      .attr('fill', '404040')
      .attr('opacity', 0.4);

  var text = svg.append('text')
      .attr('x', 20)
      .attr('y', 40)
      .attr('class', 'title')
      .attr('fill', 'white')
      .text('PRONTO Bike Share');

  var weekdayButton = svg.append('g')
      .attr('transform',
          'translate(' + (40 + text.node().getBBox().width) + ',10)')
      .attr('id', 'weekdayButton');
  createSelectedBackground(weekdayButton);
  createButtonText(weekdayButton, 'Weekday');

  var weekendButton = svg.append('g').attr('transform',
          'translate(' + (40 + text.node().getBBox().width +
              d3.select('#weekdayButton').node().getBBox().width +
              10) + ',10)')
      .attr('id', 'weekendButton');
  createSelectedBackground(weekendButton);
  createButtonText(weekendButton, 'Weekend');

  setClickEventsForButton(weekdayButton);
  setClickEventsForButton(weekendButton);

  //Make weekday the initially selected button
  makeSelectedBackgroundVisible('#weekdayButton');
}

function setClickEventsForButton(button) {
  button.on({
      'click': function() {
          var id = '#' + button.attr('id');
          makeSelectedBackgroundVisible(id);
          drawPaths(getFileName(id));
        },
      'mouseover': function(d) {
          d3.select(this).style('cursor', 'pointer');
        },
      'mouseout': function(d) {
          d3.select(this).style('cursor', 'default');
        }
    });
}

function createButtonText(button, text) {
  button.append('text')
      .attr('y', 25)
      .attr('x', 16)
      .attr('font-size', 16)
      .attr('fill', 'white')
      .text(text);
}

function createSelectedBackground(node) {
  node.append('rect')
      .attr('rx', 2)
      .attr('rx', 2)
      .attr('fill', '#444')
      .attr('width', 100)
      .attr('height', 40)
      .attr('opacity', 0);
}

function makeSelectedBackgroundVisible(id) {
  d3.select(id).select('rect').attr('opacity', 1);
  if (id == '#weekdayButton')
      makeSelectedBackgroundInvisible('#weekendButton');
  else
      makeSelectedBackgroundInvisible('#weekdayButton');
}

function makeSelectedBackgroundInvisible(id) {
  d3.select(id).select('rect').attr('opacity', 0);
}

function drawStations() {
  d3.csv('station.csv', function(d) {
      return {
          'name': d['name'],
          'point': map.latLngToLayerPoint(new L.LatLng(d['lat'], d['long']))
        };
    }, function(data) {
      g.selectAll('circle').data(data).enter().append('circle')
          .attr('cx', function(d) {
              return d['point'].x;
            }).attr('cy', function(d) {
              return d['point'].y;
            }).attr('r', 2)
          .style('fill', '#F44336');
    });
}

function getFileName(id) {
  if (id == '#weekendButton')
      return 'trip_date_max_weekend.csv';
  return 'trip_date_max.csv';
}

function drawPaths(fileName) {
  d3.csv(fileName, function(d) {
      var obj = {
          'starttime': timeFormat.parse(d['starttime']),
          'endtime': timeFormat.parse(d['stoptime']),
          'from_point': map.latLngToLayerPoint(new L.LatLng(d['from_station_lat'], d['from_station_long'])),
          'to_point': map.latLngToLayerPoint(new L.LatLng(d['to_station_lat'], d['to_station_long'])),
          'trip_id': d['trip_id']
        };
      return obj;
    }, function(originalData) {

      line = d3.svg.line();
      g.selectAll('path').remove();
      d3.selectAll('#chart').remove();
      d3.selectAll('#progressController').remove();

      g.selectAll('path').data(originalData, function(d, i) {
              return i;
            }).enter().append('path')
          .attr('d', function(d) {
              return line([
                  [d['from_point'].x, d['from_point'].y],
                  [d['to_point'].x, d['to_point'].y]
              ]);
            })
          .attr('id', function(d) {
              return 'line' + originalData.indexOf(d);
            })
          .style('opacity', '0');

      var totalAnimationTime = 10 * 1000;
      var timeRangeFactor = totalAnimationTime / (24 * 60 * 60 * 1000);
      var progressBarWidth = 300;
      var progressControllerWidth = 10;

      var chartHeight = 100;
      var chartWidth = progressBarWidth + 40;
      var xAxisFormat = d3.time.format('%H:%M');
      var x = d3.time.scale().range([0, progressBarWidth]);
      var y = d3.scale.linear().range([chartHeight, 0]);
      var xAxis = d3.svg.axis().scale(x).orient('bottom').tickFormat(xAxisFormat);
      var yAxis = d3.svg.axis().scale(y).orient('left');

      var chartMargin = 40;
      var chart = svg
          .append('g')
          .attr('transform', 'translate(' + (svg.attr('width') - 3.1 * chartWidth) + ',' +
              (svg.attr('height') - 5.6 * chartHeight) +
              ')')
          .attr('id', 'chart')
          .attr('width', chartWidth)
          .attr('height', chartHeight + chartMargin)
          .append('g');

      var timeExtent = d3.extent(originalData, function(d) {
          return d['starttime'];
        });
      var timeBins = d3.time.hours(d3.time.hour.offset(timeExtent[0], -1),
          d3.time.hour.offset(timeExtent[1], 1), 0.25);
      var binByHour = d3.layout.histogram().value(function(d) {
          return d['starttime'];
        }).bins(timeBins);
      var histData = binByHour(originalData);
      x.domain(d3.extent(timeBins));
      y.domain([0, d3.max(histData, function(d) {
          return d.y;
        })]);
      chart.selectAll('.bar').data(histData).enter().append('rect')
          .style('fill', '#1E88E5').attr('x', function(d) {
              return x(d.x);
            })
          .attr('width', 10).attr('y', function(d) {
              return y(d.y);
            })
          .attr('height', function(d) {
              return chartHeight - y(d.y);
            });

      chart.append('g')
          .attr('transform', 'translate(0,' + (chartHeight) + ')')
          .call(xAxis)
          .select('path')
          .attr('class', 'axis')
          .attr('stroke', 'white')
          .attr('fill', 'none');

      chart.append('g')
          .attr('transform', 'translate(0,0)')
          .call(yAxis)
          .select('path')
          .attr('class', 'axis')
          .attr('stroke', 'white')
          .attr('fill', 'none');

      chart.selectAll('.tick').select('line').attr('stroke-width', 1)
          .attr('stroke', 'white');
      chart.selectAll('.tick').select('text').style('fill', 'white');

      var progressController = chart.append('rect')
          .attr('y', chartHeight - 10)
          .attr('width', progressControllerWidth)
          .attr('height', 20)
          .style('fill', '#F44336')
          .attr('id', 'progressController');

      function getProgressControllerRange(startX, timeDomain) {
        return d3.time.scale.utc().domain(timeDomain)
            .range([startX, progressBarWidth - progressControllerWidth]);
      }

      function getTimeDomain(data) {
        var timeExtent = d3.extent(data, function(d) {
            return d['starttime'];
          });
        var timeDomain = [timeExtent[0], timeExtent[1]];
        return timeDomain;
      }

      function animateData(data) {
        var timeDomain = getTimeDomain(data);
        var timeRangeHigh = Math.abs(timeDomain[1] - timeDomain[0]) * timeRangeFactor;
        var timeRange = d3.time.scale.utc().domain(timeDomain).range([0, timeRangeHigh]);

        var progressControllerRange = getProgressControllerRange(0, timeDomain);
        var progressControllerTicks = progressControllerRange
            .ticks(d3.time.minute, 5);

        progressControllerTicks.forEach(function(d) {
            progressController.transition().duration(300).delay(timeRange(d))
                .attr('x', progressControllerRange(d) + progressControllerWidth);
          });

        data.forEach(function(d) {
            var selectionString = '#line' + originalData.indexOf(d);
            var totalLength = d3.select(selectionString).node().getTotalLength();

            d3.select(selectionString)
                .attr('stroke-dasharray', totalLength + ' ' + totalLength)
                .attr('stroke-dashoffset', totalLength)
                .style('opacity', '1')
                .style('stroke', '#1E88E5')
                .transition()
                .duration(300)
                .delay(timeRange(d['starttime']))
                .ease('quad')
                .attr('stroke-dashoffset', 0)
                .style('stroke-width', '2')
                .transition()
                .duration(300)
                .style('opacity', 0);
          });
      }

      setTimeout(function() {
          animateData(originalData);
        }, 300);

      function clampDragValue(drag) {
        if (drag < 0)
            return 0;
        return d3.min([d3.event.x, progressBarWidth]);
      }

      setTimeout(function() {
          dragBehavior = d3.behavior.drag();
          progressController = d3.selectAll('#progressController');
          dragBehavior.on('dragstart', function() {
              d3.event.sourceEvent.stopPropagation();
            });
          dragBehavior.on('drag', function() {
              progressController.attr('x', clampDragValue(d3.event.x));
              var progressRangeFull = getProgressControllerRange(0, getTimeDomain(originalData));
              var minDate = progressRangeFull.invert([progressController.attr('x')]);
              var filteredData = originalData.filter(function(d) {
                  return Math.abs(d['starttime'].getTime() - minDate.getTime()) <= 5 * 60 * 1000;
                });
              g.selectAll('path').style('opacity', 0);
              filteredData.forEach(function(d) {
                  g.select('#line' + originalData.indexOf(d)).style('opacity', 1);
                });
            });
          progressController.call(dragBehavior);
        }, totalAnimationTime + 1000);
    });
}
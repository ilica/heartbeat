var width = Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight);

var container = d3
  .select("#flow-animation")
/*
  .append("div")
		.attr("id", "container")
		.style("width", width + "px")
		.style("height", height + "px");
        */
    .append("svg")
		.attr("width", width + "px")
		.attr("height", height + "px");

var projection = d3.geoMercator()
		.center([-73.94, 40.70])
		.scale(80000)
		.translate([(width) / 2, (height)/2]);

var path = d3.geoPath()
		.projection(projection);

var plot = container.append("g")
    .attr("class", "plot")


d3.json("nyc.json", function(error, nyb) {

    var map = plot
        .append("g")
		.attr("id", "boroughs")
		.style("width", width + "px")
		.style("height", height + "px")
		.selectAll(".state")
		.data(nyb.features)
		.enter()
        .append("path")
		.attr("class", function(d){ return d.properties.name; })
		.attr("d", path);
});


// Returns an attrTween for translating along the specified path element.
function translateAlong(lines, direction, routes) {
  return function(d, i, a) {

    var get_path = station_name_to_path(d, direction, routes);
    if (get_path==null){
      console.log("trigger");
    }
    if (get_path==undefined){
      console.log("trigger");
    }

    var to_follow = get_path[0];
    var start_closer = get_path[1];

    if (to_follow==null){
      return function(t){
        return "translate(0,0)"
      }
    }

    var best_path = lines
      .filter(function(d){
        return path(d)==to_follow;
      }).node();
    //console.log("best path")
    //console.log(best_path)
    if (best_path==null){
      console.log("here")
    }

    var l = best_path.getTotalLength();
    return function(t) {
      var p_start = best_path.getPointAtLength(0);
      var p_end = best_path.getPointAtLength(l);
      var p;
      if (start_closer) {
         p = best_path.getPointAtLength(t * l);
        return "translate(" + (p.x - p_start.x) + "," + (p.y - p_start.y)+ ")";
      } else {
         p = best_path.getPointAtLength((1-t) * l);
        return "translate(" + (p.x - p_end.x) + "," + (p.y - p_end.y)+ ")";
      }
    };
  };
}

function eucDistance(a, b) {
    return a
        .map((x, i) => Math.abs( x - b[i] ) ** 2) // square the difference
        .reduce((sum, now) => sum + now) // sum
        ** (1/2)
}

var station_memo = {};
function station_name_to_path(station, direction, routes){
  filtered_station_coord = [station.STOP_LON, station.STOP_LAT]
  if ([filtered_station_coord, direction] in station_memo) {
    return station_memo[[filtered_station_coord, direction]];
  }

  /*
  if (station.STOP_NAME == "110TH STREET - CATHEDRAL PKWY"){
    console.log("found")
  }
  */

  var station_on_routes = station.Routes_ALL

  var chosen_line = station_on_routes.replace(/, /g, "-")

  var filtered_routes = routes.features.filter(function(d){
    var split = chosen_line.split("-");
    var find_line_name = d.properties.name.split("-");
    return split.filter(value =>
      find_line_name.includes(value)).length > 0;
  })

  var best_route = null;
  var current_shortest = 1000;
  var start_closer = true;

  var second_best = null;
  var second_shortest = 1000;
  var second_start_closer = true;

  for (candidate of filtered_routes) {
    var arr = candidate.geometry.coordinates
    var coords =[arr[0], arr[arr.length-1]];
    for (i of [0,1]) {
          coord = coords[i]
          var dist = eucDistance(filtered_station_coord, coord);

      if (dist < current_shortest){
        current_shortest = dist;
        best_route = candidate;
        if (i==0){
          start_closer = true;
        } else {
          start_closer = false;
        }
      }

      if (dist > current_shortest && dist < second_shortest){
        second_shortest = dist;
        second_best = candidate;
        if (i==0){
          second_start_closer = true;
        } else {
          second_start_closer = false;
        }
      }
    }
  }


  var selected;
  var start_direction;
  if (direction == 0) {
  selected = path(best_route);
  start_direction = start_closer;
  }

  if (direction == 1) {
  selected = path(second_best);
  start_direction = second_start_closer;
  }

  station_memo[[filtered_station_coord, direction]] = [selected,
    start_direction];
  return [selected, start_closer]


};


d3.json("subway_lines.json", function(error, routes) {
        d3.csv("joined_data.csv", function(error, stops) {

          var lines = plot.append("g")
              .attr("id", "routes")
              .style("width", width + "px")
              .style("height", height + "px")
              .selectAll(".brgh")
            .data(d => {
              return routes.features;
            })
              .enter()
            .append("path")
              .attr("d", path)
            .attr("data-name", function(d, i) {
               var name ="route_"+i;
              if (name == "route_392"){
                console.log("look")
              };
              return name;
            });

            var svg_container = plot.append("g")
                .attr("id", "stations")
                .style("width", width + "px")
                .style("height", height + "px")
                .selectAll(".stop")
                .data(stops)
                .enter()

            var stations = svg_container
                    .append("circle")
                    .attr("r", 2.5)
                    .attr("cx", function(d) {
                        return projection([d.STOP_LON,d.STOP_LAT])[0]
                    })
                    .attr("cy", function(d) {
                      return projection([d.STOP_LON,d.STOP_LAT])[1]
                    });

          svg_container
                    .append("circle")
                    .attr("cx", function(d) {
                        return projection([d.STOP_LON,d.STOP_LAT])[0]})
                    .attr("cy", function(d) {return projection([d.STOP_LON,d.STOP_LAT])[1]})
                    .attr("class", "location")
                    .style("fill", "red")
                    .attr("r", 2)
                    //.attr("transform", "translate(" + [0, 0] + ")")

          var timer = setInterval(
            function(){
              drawPlot(stops, lines, routes)}, 8000);

        });

});

var label = plot.append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .text("Loading...")
    .attr("font-size", 60)
    .attr("fill", "white")
    .attr("transform", "translate(200,200)")

var counter = 1;

var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %d");
var parseDate = d3.timeFormat("%m/%d/%Y");

var startDate = new Date("2020-02-20"),
    endDate = new Date("2020-04-23");

var x = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, 120])
    .clamp(true);

function drawPlot(data, lines, routes) {

  d3.selectAll(".location")
  .transition()
  .duration(500)
    .attr("r", d=>{
  // console.log(parseDate(x.invert(counter)))
    var current_date = parseDate(x.invert(counter))
   console.log(current_date);
   //console.log(d);
   console.log(d["02/01/20"]);
   console.log(d[current_date.toString()]);
    return d[current_date]*5;})
  .transition()
  .duration(1000)
  .attrTween("transform", translateAlong(lines, 0, routes))
  .transition()
  .duration(0)
  .attr("transform", "translate(0,0)")
  .transition()
  .duration(500)
    .attr("r", d=>{
    console.log(counter);
    return 1;})

  label
    .text(formatDate(x.invert(counter)));
  counter+=1
}

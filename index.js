var d3;
var data = "global_bleaching_environmental.csv";
var w = 1920;
var h = 1080;

d3.csv(data).then(function (rawData) {
  const cleanData = rawData.filter(d => 
    d.Percent_Bleaching !== "nd" &&
    d.TSA_DHW !== "nd" &&
    d.Date_Year !== "nd"
  );

  cleanData.forEach(d => {
    d.Percent_Bleaching = +d.Percent_Bleaching;
    d.TSA_DHW = +d.TSA_DHW;
    d.Date_Year = +d.Date_Year;
  });

  const latestBySite = new Map();

  cleanData.forEach(d => {
    const existing = latestBySite.get(d.Site_ID);
    if(!existing || d.Date_Year > existing.Date_Year) {
      latestBySite.set(d.Site_ID, d);
    }
  });

  const filteredData = Array.from(latestBySite.values());

  data = filteredData;
  buildIt();
});


function buildIt() {
  var svg = d3
    .select(".container")
    .append("svg")
    .attr("width", "90%")
    .attr("height", "90%")
    .attr("viewBox", `0 0 ${w} ${h}`);

    var chartGroup = svg.append("g").attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

  var minX = d3.min(data, function (d) {
    return d.TSA_DHW;
  });
  var maxX = d3.max(data, function (d) {
    return d.TSA_DHW;
  });
  var minY = d3.min(data, function (d) {
    return d.Percent_Bleaching;
  });
  var maxY = d3.max(data, function (d) {
    return d.Percent_Bleaching;
  });

  var xScale = d3.scaleLinear().domain([minX, maxX]).range([0, w]).nice();

  var yScale = d3.scaleLinear().domain([minY, maxY]).range([h, 0]).nice();

  var x_axis = d3.axisBottom().scale(xScale);
  var y_axis = d3.axisLeft().scale(yScale);

  /* ===== circles ===== */

  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return xScale(d.TSA_DHW);
      // return xPositioning(d);
    })
    .attr("cy", function (d) {
      return yScale(d.Percent_Bleaching);
      // return yPositioning(d)
    })
    .attr("r", function (d) {
      return circleCenter(d) * 8;
    })
    .attr("fill", "#2962FF");

  /* ===== radii ===== */

  function circleCenter(d) {
    return Math.sqrt(d.Percent_Bleaching);
  }

  /* ===== year labels ===== */

  svg
    .selectAll("text")
    .data(data)
    .enter()
    //.append("text")
    .text(function (d) {
      return d.Date_Year;
    })
    .attr("text-anchor", "middle")
    .attr("x", function (d) {
      return xScale(d.TSA_DHW);
    })
    .attr("y", function (d) {
      return yScale(d.Percent_Bleaching) + 3;
    })
    .attr("font-size", "12")
    .attr("fill", "white");

  /* ===== average ticket prices labels ===== */

  svg
    .append("g")
    .selectAll("text")
    .data(data)
    .enter()
    //.append("text")
    .text(function (d) {
      return "This is bleach percentage" + d.Percent_Bleaching + "%";
    })
    .attr("text-anchor", "middle")
    .attr("x", function (d) {
      return xScale(d.TSA_DHW) + circleCenter(d) * 9;
    })
    .attr("y", function (d) {
      return yScale(d.Percent_Bleaching) - circleCenter(d) * 8;
    })
    .attr("font-size", "11")
    .attr("fill", "#546c78");

  /* ===== axes ===== */

  svg
    .append("g")
    .call(x_axis)
    .attr("transform", "translate(0," + h + ")");

  svg.append("g").call(y_axis);
}

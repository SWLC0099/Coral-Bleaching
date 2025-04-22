var width = 400;
var height = 400;

var myCanvas = d3
    .select("#myVis")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "antiquewhite");

myCanvas
    .append("circle")
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", 20)
    .attr("fill", "hsb(200, 100, 10)");

var d3;
var data = "global_bleaching_environmental.csv";
var w = 2048;
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

function randomVibrantColor() {
  const hue = Math.floor(Math.random() * 360); // full hue range
  const saturation = 90 + Math.random() * 10; // 90–100%
  const lightness = 45 + Math.random() * 10; // 45–55%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

const reefColors = [
  "#FF6F61", // coral red
  "#FFB400", // golden yellow
  "#6FCF97", // sea green
  "#56CCF2", // tropical blue
  "#9B51E0", // vibrant purple
  "#EB5757", // deep pink
  "#27AE60", // rich green
];

const colorScale = d3.scaleSequential()
  .domain([0, 100])
  .interpolator(d3.interpolateRainbow); // or interpolateTurbo, interpolateWarm, etc.

function buildIt() {
  var svg = d3
    .select(".container")
    .append("svg")
    .attr("width", "90%")
    .attr("height", "90%")
    .attr("viewBox", `0 0 ${w} ${h}`);

  // Add dark ocean-like background
  svg
    .append("rect")
    .attr("width", w)
    .attr("height", h)
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "#001f3f"); // A deep blue color

  /* Animated force directed collision layout
    const simulation = d3
      .forceSimulation(data)
      .force("x", d3.forceX(w / 2).strength(0.05))
      .force("y", d3.forceY(h / 2).strength(0.05))
      .force("collision", d3.forceCollide().radius(4)) // avoid overlap
      .on("tick", ticked);

    function ticked() {
      const u = svg.selectAll("circle").data(data);

      u.enter()
        .append("circle")
        .attr("r", 3)
        .merge(u)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("fill", "#2962FF");
    }
*/
  //  var chartGroup = svg.append("g").attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

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

  const radius = 500;
  const centerX = w / 2;
  const centerY = h / 2;

  const root = d3
    .hierarchy({ children: data })
    .sum((d) => 1) // or size value
    .sort(() => Math.random()); // helps break up uniformity

  const packLayout = d3.pack().size([w, h]).padding(1); // space between circles

  const packed = packLayout(root);

  svg
    .selectAll("circle")
    .data(packed.leaves())
    .enter()
    .append("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r)
    .attr("fill", (d) => colorScale(d.data.Percent_Bleaching))
//    .attr("fill", () => reefColors[Math.floor(Math.random() * reefColors.length)])
//    .attr("fill-opacity", 0.8);

  /*    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => centerX + radius * Math.cos((2 * Math.PI * i) / data.length))
    .attr("cy", (d, i) => centerX + radius * Math.sin((2 * Math.PI * i) / data.length))
    .attr("r", 2)
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
    */

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

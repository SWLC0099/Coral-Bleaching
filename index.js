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
    d.Site_Name
    d.Country_Name
    d.Ocean_Name
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

  let bleachingView = false;

function buildIt(renderData = data) {
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
    .hierarchy({ children: renderData })
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
    .on("mouseover", function (event, d) {
      // Highlight
      d3.select(this).attr("stroke", "white").attr("stroke-width", 2).raise();
      // Slightly smoother highlight
      //d3.select(this).transition().duration(150).attr("stroke", "white").attr("stroke-width", 2);

      // Tooltip
      d3.select("#tooltip").style("visibility", "visible").html(`
          <strong>Site:</strong> ${
            d.data.Site_Name === "nd" ? "Unnamed" : d.data.Site_Name
          }<br>
          <strong>Year:</strong> ${d.data.Date_Year}<br>
          <strong>Country:</strong> ${d.data.Country_Name || "Unknown"}<br>
          <strong>Ocean:</strong> ${d.data.Ocean_Name || "Unknown"}<br>
          <strong>Bleaching:</strong> ${d.data.Percent_Bleaching.toFixed(
            1
          )}%<br>
          <strong>Thermal Stress (DHW):</strong> ${d.data.TSA_DHW.toFixed(1)}
        `);
    })
    .on("mousemove", function (event) {
      d3.select("#tooltip")
        .style("top", event.pageY + 15 + "px")
        .style("left", event.pageX + 15 + "px");
    })
    .on("mouseout", function () {
      // Remove highlight
      d3.select(this).attr("stroke", null).attr("stroke-width", null);
      // Remove Slightly smoother highlight
      //d3.select(this).transition().duration(150).attr("stroke", null).attr("stroke-width", null);

      // Hide tooltip
      d3.select("#tooltip").style("visibility", "hidden");
    });
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

document.getElementById("toggleColors").addEventListener("click", () => {
  bleachingView = !bleachingView;

  d3.selectAll("circle")
    .transition()
    .duration(1500)
    .ease(d3.easeCubic)
    .attrTween("fill", function (d) {
      const vibrant = d3.color(colorScale(d.data.Percent_Bleaching));
      const bleachLevel = d.data.Percent_Bleaching / 100;
      const startColor = d3.color(d3.select(this).attr("fill"));
      const targetBleach = bleachingView ? bleachLevel : 0;

      const rInterp = d3.interpolateNumber(
        startColor.r,
        vibrant.r + (255 - vibrant.r) * targetBleach
      );
      const gInterp = d3.interpolateNumber(
        startColor.g,
        vibrant.g + (255 - vibrant.g) * targetBleach
      );
      const bInterp = d3.interpolateNumber(
        startColor.b,
        vibrant.b + (255 - vibrant.b) * targetBleach
      );

      return function (t) {
        const r = Math.round(rInterp(t));
        const g = Math.round(gInterp(t));
        const b = Math.round(bInterp(t));
        return `rgb(${r}, ${g}, ${b})`;
      };
    });

  document.getElementById("toggleColors").innerText = bleachingView
    ? "Switch to Vibrant Coral View"
    : "Switch to Bleaching View";
});

document.getElementById("sortOptions").addEventListener("change", function () {
  const value = this.value;
  let sortedData;

  if (value === "bleachOuter") {
    sortedData = [...data].sort(
      (a, b) => b.Percent_Bleaching - a.Percent_Bleaching
    );
  } else if (value === "bleachInner") {
    sortedData = [...data].sort(
      (a, b) => a.Percent_Bleaching - b.Percent_Bleaching
    );
  } else if (value === "random") {
    sortedData = [...data].sort(() => Math.random() - 0.5);
  } else {
    sortedData = data;
  }

  const newRoot = d3
    .hierarchy({ children: sortedData })
    .sum((d) => 1)
    .sort(() => Math.random()); // helps avoid rigid structure

  const newPacked = d3.pack().size([w, h]).padding(1)(newRoot);

  // Update existing circles with transition
  d3.selectAll("circle")
    .data(newPacked.leaves(), (d) => d.data.Site_ID) // use Site_ID as a key
    .transition()
    .duration(1000)
    .delay((d, i) => i * 2) // slight staggering
    .ease(d3.easeQuadInOut)
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r);
});

const legendWidth = 280;
const legendHeight = 20;

const legendSvg = d3
  .select("#legend")
  .append("svg")
  .attr("width", 360) // add room for padding/text
  .attr("height", 60);

// Create defs and gradient
const defs = legendSvg.append("defs");
const gradient = defs
  .append("linearGradient")
  .attr("id", "legendGradient")
  .attr("x1", "0%")
  .attr("x2", "100%")
  .attr("y1", "0%")
  .attr("y2", "0%");

const numStops = 10;
const step = 1 / (numStops - 1);
d3.range(numStops).forEach((i) => {
  gradient
    .append("stop")
    .attr("offset", `${i * step * 100}%`)
    .attr("stop-color", d3.interpolateRainbow(i * step));
});

// Draw gradient bar
const legendGroup = legendSvg
  .append("g")
  //.attr("transform", `translate(${(360 - legendWidth) / 2}, 0)`);

// Draw gradient bar
legendGroup
  .append("rect")
  .attr("x", 0) // starts at 0 within group
  .attr("y", 10)
  .attr("width", legendWidth)
  .attr("height", legendHeight)
  .style("fill", "url(#legendGradient)")
  .style("rx", 6)
  .style("ry", 6);

// Add text labels
legendGroup
  .append("text")
  .attr("x", 0)
  .attr("y", 45)
  .attr("text-anchor", "start")
  .attr("class", "legend-label")
  .text("0% bleaching");

legendGroup
  .append("text")
  .attr("x", legendWidth)
  .attr("y", 45)
  .attr("text-anchor", "end")
  .attr("class", "legend-label")
  .text("100% bleaching");
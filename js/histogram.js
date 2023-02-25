let x, y;
let n_bins;
let sims = [];

let summa = 0;
let mean = 0;

let margin = { top: 20, right: 20, bottom: 20, left: 30 }
let width, height;

let svg = d3.select("body")
  .append("svg")
    .attr("width", width)
    .attr("height", height)

let axis = [
  svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`),
  svg.append("g").attr("transform", `translate(${margin.left},0)`)];

let name_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("fill", "blue");
let iter_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue");
let mean_line = svg.append("line").attr("stroke", "blue");
let mean_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue");

let stats = false;
let qs, q_lines, q_texts;

window.addEventListener("load", (e) => {
  width = window.innerWidth-20;
  height = window.innerHeight-20;
  const query = window.location.search;
  const params = new URLSearchParams(query);
  name_text.text(params.get("name")).attr("x", width-margin.right).attr("y", margin.top);
  nbins = parseInt(params.get("nbins"));
  window.addEventListener("message", message, false);
  window.addEventListener("resize", resize, false);
});

function message(e) {
  let json = JSON.parse(e.data);
  let iter = parseInt(json.iter);
  if (iter > 0) {
    let value = parseFloat(json.value);
    iter_text.text("iter " + iter).attr("x", width-margin.right).attr("y", 2*margin.top);
    if (sims.length == 0) {
      x = d3.scaleLinear()
          .domain([0,2*value])
          .range([margin.left, width - margin.right]);
      axis[0].call(d3.axisBottom(x));
      y = d3.scaleLinear()
           .domain([0, 1])
           .range([height - margin.bottom, margin.top]);
     axis[1].call(d3.axisLeft(y));
    }
    sims.push(value);
    summa += value;
    mean = summa / sims.length;
    repaint();
  }
  else {
    sims = sims.order();
    let l = sims.length;
    qs = [sims[Math.round(l/4)], sims[Math.round(l/2)], sims[Math.round(3*l/4)]];
    q_lines = [1, 2, 3].map(q => {
      svg.append("text").text("Q" + q)
      .attr("text-anchor", "end").attr("font-family", "Arial").attr("fill", "yellow");
    });
    q_texts = [1, 2, 3].map(q => {
      svg.append("line").attr("stroke", "blue");
    });
    stats = true;
    resize();
  }
}

function repaint() {
  let bins = d3.histogram()
      .domain(x.domain())
      .thresholds(x.ticks(nbins))
      (sims);
  svg.selectAll("rect")
      .data(bins)
      .join(
          enter => enter
              .append("rect")
              .attr("x", function(d) {return x(d.x0)})
              .attr("y", function(d) {return y(d.length/sims.length)})
              .attr("width", function(d) {return x(d.x1) - x(d.x0) - 2})
              .attr("height", function(d) {return y(0) - y(d.length/sims.length)})
              .style("fill", "green"),
          update => update
              .attr("x", function(d) {return x(d.x0)})
              .attr("y", function(d) {return y(d.length/sims.length)})
              .attr("width", function(d) {return x(d.x1) - x(d.x0) - 2})
              .attr("height", function(d) {return y(0) - y(d.length/sims.length)}));
  let mean_x = x(mean)
  mean_line
    .attr("x1", mean_x)
    .attr("x2", mean_x)
    .attr("y1", y(1))
    .attr("y2", y(0));
  mean_text
    .text("mean=" + mean)
    .attr("x", mean_x-2)
    .attr("y", margin.top);
}

function resize() {
  width = window.innerWidth - margin.left;
  height = window.innerHeight - margin.top;
  svg.attr("width", width).attr("height", height);
  x.range([margin.left, width - margin.right]);
  axis[0].attr("transform", `translate(0,${height - margin.bottom})`);
  axis[0].call(d3.axisBottom(x));
  y.range([height - margin.bottom, margin.top]);
  axis[1].attr("transform", `translate(${margin.left},0)`);
  axis[1].call(d3.axisLeft(y));
  name_text.attr("x", width-margin.right).attr("y", margin.top);
  iter_text.attr("x", width-margin.right).attr("y", 2*margin.top);
  if (stats) {
    qs.map(q => x(q))
      .forEach((q,i) => {
        q_lines[i].attr("x1", q).attr("x2", q).attr("y1", y(1)).attr("y2", y(0));
        q_texts[i].attr("x", q-2).attr("y", (i+2)*margin.top);
      });
  }
  repaint();
}

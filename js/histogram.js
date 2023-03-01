let x, y;
let n_bins;
let sims = [];

let summa = 0;
let mean = 0;

let margin = { top: 20, right: 20, bottom: 20, left: 30 }
let width, height;

let svg, axis;
let name_text, iter_text, mean_line, mean_text;
let stats = false;
let qs, q_lines, q_texts;
let mouse = false;
let m_line, m_text;
let h_lines;

window.addEventListener("load", (e) => {
  const query = window.location.search;
  const params = new URLSearchParams(query);
  nbins = parseInt(params.get("nbins"));
  width = window.innerWidth - margin.left;
  height = window.innerHeight - margin.top;
  svg = d3.select("body")
    .append("svg")
      .attr("width", width)
      .attr("height", height);
  axis = [
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`),
    svg.append("g").attr("transform", `translate(${margin.left},0)`)];
  y = d3.scaleLinear()
       .domain([0, 1])
       .range([height - margin.bottom, margin.top]);
  axis[1].call(d3.axisLeft(y));
  h_lines = Array(9).map((_,i) => {
    let h = y((i+1)/10);
    console.log(((i+1)/10) + "=>" + h);
    return svg.append("line")
      .attr("stroke", "black")
      .attr("stroke-dasharray", "2 3")
      .attr("x1", margin.left).attr("x2", width-margin.right)
      .attr("y1", h).attr("y2", h);
    });
  name_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("fill", "blue").text(params.get("name")).attr("x", width-margin.right).attr("y", margin.top);
  iter_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue").attr("x", width-margin.right).attr("y", 2*margin.top);
  mean_line = svg.append("line").attr("stroke", "blue");
  mean_text = svg.append("text").attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue");
  window.addEventListener("message", message, false);
  window.addEventListener("resize", resize, false);
});

function message(e) {
  let json = JSON.parse(e.data);
  let iter = parseInt(json.iter);
  if (iter >= 0) {
    let value = parseFloat(json.value);
    iter_text.text("iter " + iter).attr("x", width-margin.right).attr("y", 2*margin.top);
    if (sims.length == 0) {
      x = d3.scaleLinear()
          .domain([0,2*value])
          .range([margin.left, width - margin.right]);
      axis[0].call(d3.axisBottom(x));
    }
    sims.push(value);
    summa += value;
    mean = summa / sims.length;
    repaint();
  } else {
    sims = sims.sort();
    let l = sims.length;
    qs = [sims[Math.round(l/4)], sims[Math.round(l/2)], sims[Math.round(3*l/4)]];
    q_texts = qs.map((q,i) => {
        return svg.append("text")
          .attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue")
          .text("Q" + (i+1) + "=" + q)
          .attr("x", x(q)-2).attr("y", 2*(i+2)*margin.top);
      });
    q_lines = qs.map(q => x(q))
      .map((q,i) => {
        return svg.append("line")
          .attr("stroke", "blue")
          .attr("stroke-dasharray", "5 5")
          .attr("x1", q).attr("x2", q).attr("y1", y(1)).attr("y2", y(0));
      });
    m_text = svg.append("text")
      .attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue");
    m_line = svg.append("line")
        .attr("stroke", "blue");
    mean_line.remove();
    mean_text.remove();
    stats = true;
    svg.on("mouseenter", x => {mouse=true;});
    svg.on("mouseleave", x => {mouse=false;});
    svg.on("mousemove", mousemove);
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
  if (!stats) {
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
  h_lines.forEach((l,i) => {
    let h = y((i+1)/10);
    l.attr("x1", margin.left).attr("x2", width-margin.right)
    .attr("y1", h).attr("y2", h);
  });
  name_text.attr("x", width-margin.right).attr("y", margin.top);
  iter_text.attr("x", width-margin.right).attr("y", 2*margin.top);
  if (stats) {
    qs.map(q => x(q))
      .forEach((q,i) => {
        q_texts[i].attr("x", q-2).attr("y", (i+2)*margin.top);
        q_lines[i].attr("x1", q).attr("x2", q).attr("y1", y(1)).attr("y2", y(0));
      });
  }
  repaint();
}

function mousemove(e) {
  const coord = e.x;
  if ((coord>margin.left) && (coord<(width-margin.right))) {
    const value = x.invert(coord);
    const idx = sims.findIndex(x => x>value);
    let q;
    if (idx>=0) {q = Math.round(100 * (idx / sims.length));}
    else {q = 100;}

    m_text.text("Q=" + q + "%").attr("x", coord-2).attr("y", margin.top).attr("visibility", "visible");
    m_line.attr("x1", coord).attr("x2", coord).attr("y1", y(1)).attr("y2", y(0)).attr("visibility", "visible");
  } else {
    m_text.attr("visibility", "hidden");
    m_line.attr("visibility", "hidden");
  }
}

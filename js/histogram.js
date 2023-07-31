let x, y;
let n_bins;
let sims = [];
let domain = [0,0];
let max_scale = .1, max_step = 10;
let href;

let summa = 0;
let mean = 0;

let margin = { top: 20, right: 20, bottom: 20, left: 40 }
let width, height;

let svg, axis;
let name_text, iter_text, mean_line, mean_text;
let avg_text, stdev_text, median_text, mode_text, min_text, max_text;
let stats = false;
let qs, q_lines, q_texts, q_texts1, q_texts2;
let mouse = false;
let mdown = -1, mp = -1;
let inter_line, inter_text;
let m_line, m_text;

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
       .domain([0, max_scale * max_step])
       .range([height - margin.bottom, margin.top]);
  axis[1].call(d3.axisLeft(y));
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
      href = Math.abs(value/20);
      domain = [value - href, value + href];
      x = d3.scaleLinear()
          .domain(domain)
          .range([margin.left, width - margin.right]);
      axis[0].call(d3.axisBottom(x));
    } else if (value <= domain[0]) {
      domain[0] = value - href;
      x.domain(domain);
      axis[0].call(d3.axisBottom(x));
    } else if (value >= domain[1]) {
      domain[1] = value + href;
      x.domain(domain);
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
          .attr("y", 2*(i+2)*margin.top);
        });
    q_texts1 = q_texts.map((q,i) => {
        return q.append("tspan")
          .text("Q" + (i+1))
          .attr("x", x(qs[i])-2)
          .attr("dy", 15);
        });
    q_texts2 = q_texts.map((q,i) => {
        return q.append("tspan")
          .text(qs[i].toFixed(2))
          .attr("x", x(qs[i])-2)
          .attr("dy", 15);
        });
    q_lines = qs.map(q => x(q))
      .map((q,i) => {
        return svg.append("line")
          .attr("stroke", "blue")
          .attr("stroke-dasharray", "5 5")
          .attr("x1", q).attr("x2", q).attr("y1", height-margin.bottom).attr("y2", margin.top);
      });
	  
	inter_line = svg.append("rect")
		.style("fill", "red").style("fill-opacity", ".2")
		.attr("y", margin.top).attr("height", height-margin.top-margin.bottom);
	inter_text = svg.append("text")
		.attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "red")
		.attr("text-anchor", "end").attr("y", margin.top)	
	  
	iter_text.attr("x", width-margin.right).attr("y", 2*margin.top);
	  
	avg_text = svg.append("text")
		.text("mean = " + pmean(sims).toFixed(2))
		.attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue")
		.attr("text-anchor", "end").attr("x", width-margin.right).attr("y", 4*margin.top);
	stdev_text = svg.append("text")
		.text("stdev = " + pstdev(sims).toFixed(2))
		.attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue")
		.attr("text-anchor", "end").attr("x", width-margin.right).attr("y", 4*margin.top+20);
	median_text = svg.append("text")
		.text("median = " + pmedian(sims).toFixed(2))
		.attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue")
		.attr("text-anchor", "end").attr("x", width-margin.right).attr("y", 4*margin.top+40);
	mode_text = svg.append("text")
		.text("mode = " + (1.0*pmode(sims)).toFixed(2))
		.attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue")
		.attr("text-anchor", "end").attr("x", width-margin.right).attr("y", 4*margin.top+60);
	min_text = svg.append("text")
		.text("min = " + Math.min(...sims).toFixed(2))
		.attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue")
		.attr("text-anchor", "end").attr("x", width-margin.right).attr("y", 4*margin.top+80);
	max_text = svg.append("text")
		.text("max = " + Math.max(...sims).toFixed(2))
		.attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue")
		.attr("text-anchor", "end").attr("x", width-margin.right).attr("y", 4*margin.top+100);
		
		
    m_text = svg.append("text")
      .attr("text-anchor", "end").attr("font-family", "Arial").attr("font-size", "smaller").attr("fill", "blue");
    m_text1 = m_text.append("tspan")
      .attr("dy", 15);
    m_text2 = m_text.append("tspan")
      .attr("dy", 15);
    m_line = svg.append("line")
        .attr("stroke", "blue");
    mean_line.remove();
    mean_text.remove();
    stats = true;
    svg.on("mouseenter", x => {mouse=true;});
    svg.on("mouseleave", x => {mouse=false;});
    svg.on("mousemove", mousemove);
	svg.on("mousedown", mousedown);
	svg.on("mouseup", mouseup);
  }
}

function repaint() {
  let bins = d3.histogram()
      .domain(x.domain())
      .thresholds(x.ticks(nbins))
      (sims);  
  if (!stats) {
	  let step = Math.ceil(Math.max.apply(Math, bins.map(b => b.length)) / (max_scale * sims.length));  
	  //console.log("==========================================")
	  //console.log("max => (" + max_scale + "," + max_step + ")");
	  //console.log("step => "+ step);
	  if ((step == 1) || (step < max_step)) {
		//console.log("prob menor");
		if (step <=  1) {
		  max_scale /= 10;
		  max_step = 10;
		} else max_step -= 1;
		rescale(max_scale, max_step);
	  } else if (step > max_step) {
		//console.log("prob mayor");
		if (step >  10) {
		  max_scale *= 10;
		  max_step = 1;
		} else max_step += 1;
		rescale(max_scale, max_step);
	  }
  }
  svg.selectAll(".bar")
      .data(bins)
      .join(
          enter => enter
              .append("rect")
			  .attr("class", "bar")
              .attr("x", function(d) {return x(d.x0)})
              .attr("y", function(d) {return y(d.length/sims.length)})
              .attr("width", function(d) {return x(d.x1) - x(d.x0) - 2})
              .attr("height", function(d) {return height - margin.top - y(d.length/sims.length)})
              .style("fill", "green"),
          update => update
              .attr("x", function(d) {return x(d.x0)})
              .attr("y", function(d) {return y(d.length/sims.length)})
              .attr("width", function(d) {return x(d.x1) - x(d.x0) - 2})
              .attr("height", function(d) {return height - margin.top - y(d.length/sims.length)}));
  if (!stats) {
    let mean_x = x(mean)
    mean_line
      .attr("x1", mean_x)
      .attr("x2", mean_x)
      .attr("y1", height-margin.bottom)
      .attr("y2", margin.top);
    mean_text
      .text("mean=" + mean.toFixed(2))
      .attr("x", mean_x-2)
      .attr("y", margin.top);
  }
}

function resize() {
  //console.log("RESIZE => " + mdown + " -> " + mup);
  width = window.innerWidth - margin.left;
  height = window.innerHeight - margin.top;
  svg.attr("width", width).attr("height", height);
  x.range([margin.left, width - margin.right]);
  axis[0].attr("transform", `translate(0,${height - margin.bottom})`);
  axis[0].call(d3.axisBottom(x));
  y.range([height - margin.bottom, margin.top]);
  axis[1].attr("transform", `translate(${margin.left},0)`);
  axis[1].call(d3.axisLeft(y));
  svg.selectAll(".grid")
      .data(y.ticks())
      .join(
          update => update
                .attr("visibility", "visible")
				.attr("x1", margin.left)
                .attr("x2", width-margin.right)
                .attr("y1", x => y(x))
                .attr("y2", x => y(x)));
  name_text.attr("x", width-margin.right).attr("y", margin.top);
  iter_text.attr("x", width-margin.right).attr("y", 2*margin.top);
  if (stats) {
	avg_text.attr("x", width-margin.right).attr("y", 4*margin.top);
	stdev_text.attr("x", width-margin.right).attr("y", 4*margin.top+20);
	median_text.attr("x", width-margin.right).attr("y", 4*margin.top+40);
	mode_text.attr("x", width-margin.right).attr("y", 4*margin.top+60);
	min_text.attr("x", width-margin.right).attr("y", 4*margin.top+80);
	max_text.attr("x", width-margin.right).attr("y", 4*margin.top+100);
    qs.map(q => x(q))
      .forEach((q,i) => {
        q_texts[i].attr("y", (i+2)*margin.top);
        q_texts1[i].attr("x", q-2);
        q_texts2[i].attr("x", q-2);
        q_lines[i].attr("x1", q).attr("x2", q).attr("y1", height-margin.bottom).attr("y2", margin.top);
      });
	if (mdown != -1 && mup != -1) {
		inter_line
			.attr("x", x(Math.min(mdown, mup))).attr("width", Math.abs(x(mdown)-x(mup)))
			.attr("y", margin.top).attr("height", height-margin.top-margin.bottom);
		inter_text.attr("x", x(Math.max(mdown,mup))).attr("y", margin.top);		
		}
  }
  repaint();
}

function rescale(scale, step) {
  y.domain([0, scale * step]);
  axis[1].call(d3.axisLeft(y));
  //console.log("ticks => " + y.ticks());
  svg.selectAll(".grid")
      .data(y.ticks())
      .join(
          enter => enter
              .append("line")
                .attr("class", "grid")
                .attr("stroke", "black")
                .attr("stroke-dasharray", "2 5")
                .attr("visibility", "visible")
                .attr("x1", margin.left)
                .attr("x2", width-margin.right)
                .attr("y1", x => y(x))
                .attr("y2", x => y(x)),
          update => update
                .attr("visibility", "visible")
                .attr("y1", x => y(x))
                .attr("y2", x => y(x)),
          exit => exit
              .attr("visibility", "hidden"));
}

function mousemove(e) {
  const coord = e.x;
  if ((coord>margin.left) && (coord<(width-margin.right))) {
    const value = x.invert(coord);    
    let q;    
	if (mdown == -1 || mup != -1) {
		const idx = sims.findIndex(x => x>value);
		if (idx>=0) {q = Math.round(100 * (idx / sims.length));}
		else {q = 100;}
		m_text.attr("y", margin.top).attr("visibility", "visible");
		m_text1.text("Q=" + q + "%").attr("x", coord-2).attr("visibility", "visible");
		m_text2.text(value.toFixed(2)).attr("x", coord-2).attr("visibility", "visible");
		m_line.attr("x1", coord).attr("x2", coord).attr("y1", height-margin.bottom).attr("y2", margin.top).attr("visibility", "visible");
	}
	else {
		const idx1 = sims.findIndex(x => x>Math.min(mdown,value));
		const idx2 = sims.findIndex(x => x>Math.max(mdown,value));
		if (idx1>=0 && idx2>=0) {q = Math.round(100 * (Math.abs(idx1-idx2) / sims.length));}
		else if (idx1>=0) {q = Math.round(100 * (Math.abs(idx1-sims.length) / sims.length));}
		else {q = 0;}
		//console.log("mousemove => " + mdown + "->" + value);	
		const begin = x(mdown);
		inter_line.attr("x", Math.min(begin, coord)).attr("width", Math.abs(coord-begin));		
		inter_text.text("Qinterval=" + q + "%").attr("x", Math.max(begin,coord));	
	}
  } else {
    m_text.attr("visibility", "hidden");
    m_text1.attr("visibility", "hidden");
    m_text2.attr("visibility", "hidden");
    m_line.attr("visibility", "hidden");
  }
}

function mousedown(e) {
  const coord = e.x;
  //console.log("mousedown => " + coord);
  if ((coord>margin.left) && (coord<(width-margin.right))) {
	mup = -1;
    mdown = x.invert(coord);	
  }
}

function mouseup(e) {
  const coord = e.x;
  //console.log("mouseup => " + coord);
  if ((coord>margin.left) && (coord<(width-margin.right))) 
    mup = x.invert(coord);
  else
	mdown = -1;
}

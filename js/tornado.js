let win;
let tornado_running = false;
let tornado_paused = false;

async function montecarlo_start() {
  await Excel.run(async(context) => {
    document.getElementById("play").disabled = true;
    document.getElementById("stop").disabled = false;
    document.getElementById("pause").disabled = false;
    tornado_paused = false;
    if (!tornado_running) {
      tornado_running = true;
      let app = context.workbook.application;
      var prophecy = context.workbook.worksheets.getItem("prophecy");
      range_in = prophecy.getRange("A" + 2 + ":G" + (1+randoms.length));
      range_in.load("values");
      range_out = prophecy.getRange("I" + 2 + ":K" + (1+forecasts.length));
      range_out.load("values");
      await context.sync();
      let confs_in = range_in.values;
      let confs_out = range_out.values;
      win = [];
      let niter = parseInt(document.getElementById("niter").value);
      let nbins = parseInt(document.getElementById("nbins").value);
      confs_out.forEach((c,i) => {
        win[i] = window.open("https://rebo16v.github.io/prophecy/tornado.html?id=" + i + "&name=" + c[0] + "&nbins=" + nbins, "forecast_"+i);
      });
      await new Promise(r => setTimeout(r, 1000));
      confs_in.forEach((c,i) => {
        for (let k = 0; k < niter; k++) {
          if (!tornado_running) break;
          while (tornado_paused) {await new Promise(r => setTimeout(r, 1000));}
          app.suspendApiCalculationUntilNextSync();
          stepIn(c, context);
          await context.sync();
          let outputs = stepOut(confs_out, context);
          await context.sync();
          outputs.forEach((o,i) => {
            let msg = JSON.stringify({input: i, iter: k, value: o.values[0][0]});
            win[i].postMessage(msg);
          });
        }
      });
      let msg = JSON.stringify({iter: -1});
      win.forEach(w => {
        w.postMessage(msg);
      });
      document.getElementById("play").disabled = false;
      document.getElementById("stop").disabled = true;
      document.getElementById("pause").disabled = true;
      tornado_running = false;
      tornado_paused = false;
    }
  });
}

function stepIn(conf, context) {
  let input;
  switch (conf[3]) {
    case "uniform":
      input = sampleUniform(conf[4], conf[5]);
      break;
    case "normal":
      input = sampleNormal(conf[4], conf[5]);
      break;
    case "triangular":
      input = sampleTriangular(conf[4], conf[5], conf[6]);
      break;
    case "binomial":
      input = sampleBinomial(conf[4]);
      break;
  }
  let [s, c] = conf[1].split("!");
  let sheet = context.workbook.worksheets.getItem(s);
  let cell = sheet.getRange(c);
  cell.values = [[input]];
}

function stepOut(confs, context) {
  let ranges = [];
  confs.forEach(conf => {
    let [s, c] = conf[1].split("!");
    let sheet = context.workbook.worksheets.getItem(s);
    range = sheet.getRange(c);
    range.load("values");
    ranges.push(range);
  });
  return ranges;
}

async function montecarlo_stop() {
  console.log("montecarlo_stop");
  document.getElementById("stop").disabled = true;
  document.getElementById("play").disabled = false;
  document.getElementById("pause").disabled = true;
  tornado_running = false;
}

async function montecarlo_pause() {
  console.log("montecarlo_pause");
  document.getElementById("pause").disabled = true;
  document.getElementById("play").disabled = false;
  tornado_paused = true;
}
let win;
let running = false;
let paused = false;

async function montecarlo_start() {
  await Excel.run(async(context) => {
    document.getElementById("play").disabled = true;
    document.getElementById("stop").disabled = false;
    document.getElementById("pause").disabled = false;
    paused = false;
    if (!running) {
      running = true;
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
        win[i] = window.open("https://rebo16v.github.io/simulation.html?id=" + i + "&name=" + c[0] + "&nbins=" + nbins, "forecast_"+i);
      });
      await new Promise(r => setTimeout(r, 1000));
      for (let k = 0; k < niter; k++) {
        if (!running) break;
        while (paused) {await new Promise(r => setTimeout(r, 1000));}
        app.suspendApiCalculationUntilNextSync();
        stepIn(confs_in, context);
        await context.sync();
        let outputs = stepOut(confs_out, context);
        await context.sync();
        outputs.forEach((o,i) => {
          let msg = JSON.stringify({iter: k, value: o.values[0][0]});
          win[i].postMessage(msg);
        });
      }
      let msg = JSON.stringify({iter: -1});
      outputs.forEach((o,i) => {
        win[i].postMessage(msg);
      });
      document.getElementById("play").disabled = false;
      document.getElementById("stop").disabled = true;
      document.getElementById("pause").disabled = true;
      running = false;
      paused = false;
    }
  });
}

function stepIn(confs, context) {
  confs.forEach(conf => {
    let input = 0;
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
  });
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
  running = false;
}

async function montecarlo_pause() {
  console.log("montecarlo_pause");
  document.getElementById("pause").disabled = true;
  document.getElementById("play").disabled = false;
  paused = true;
}

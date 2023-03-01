let montecarlo_win;
let montecarlo_running = false;
let montecarlo_paused = false;

async function montecarlo_start() {
  await Excel.run(async(context) => {
    document.getElementById("play").disabled = true;
    document.getElementById("stop").disabled = false;
    document.getElementById("pause").disabled = false;
    montecarlo_paused = false;
    if (!montecarlo_running) {
      montecarlo_running = true;
      let app = context.workbook.application;
      var prophecy = context.workbook.worksheets.getItem("prophecy");
      range_in = prophecy.getRange("A" + 2 + ":G" + (1+randoms.length));
      range_in.load("values");
      range_out = prophecy.getRange("I" + 2 + ":K" + (1+forecasts.length));
      range_out.load("values");
      await context.sync();
      let confs_in = range_in.values;
      let confs_out = range_out.values;
      montecarlo_win = [];
      let niter = parseInt(document.getElementById("niter").value);
      let nbins = parseInt(document.getElementById("nbins").value);
      confs_out.forEach((c,i) => {
        montecarlo_win[i] = window.open("https://rebo16v.github.io/prophecy/montecarlo.html?id=" + i + "&name=" + c[0] + "&nbins=" + nbins, "forecast_"+i);
      });
      await new Promise(r => setTimeout(r, 1000));
      for (let k = 0; k < niter; k++) {
        if (!montecarlo_running) break;
        while (montecarlo_paused) {await new Promise(r => setTimeout(r, 1000));}
        app.suspendApiCalculationUntilNextSync();
        montecarlo_in(confs_in, context);
        await context.sync();
        let outputs = montecarlo_out(confs_out, context);
        await context.sync();
        outputs.forEach((o,i) => {
          let msg = JSON.stringify({iter: k, value: o.values[0][0]});
          montecarlo_win[i].postMessage(msg);
        });
      }
      let msg = JSON.stringify({iter: -1});
      montecarlo_win.forEach(w => {
        w.postMessage(msg);
      });
      document.getElementById("play").disabled = false;
      document.getElementById("stop").disabled = true;
      document.getElementById("pause").disabled = true;
      montecarlo_running = false;
      montecarlo_paused = false;
    }
  });
}

function montecarlo_in(confs, context) {
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

function montecarlo_out(confs, context) {
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
  document.getElementById("stop").disabled = true;
  document.getElementById("play").disabled = false;
  document.getElementById("pause").disabled = true;
  montecarlo_running = false;
}

async function montecarlo_pause() {
  document.getElementById("pause").disabled = true;
  document.getElementById("play").disabled = false;
  montecarlo_paused = true;
}

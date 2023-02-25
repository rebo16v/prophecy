let randoms = [];
let forecasts = [];

Office.onReady((info) => {
    if (info.host === Office.HostType.Excel) {
        document.getElementById("none").onchange = radioChange;
        document.getElementById("input").onchange = radioChange;
        document.getElementById("output").onchange = radioChange;
        document.getElementById("config").onclick = config;
        document.getElementById("stop").onclick = montecarlo_stop;
        document.getElementById("play").onclick = montecarlo_start;
        document.getElementById("pause").onclick = montecarlo_pause;

        Excel.run((context) => {
            context.workbook.onSelectionChanged.add(workbookChange)
            context.workbook.worksheets.load("items")
            return context.sync().then(function(){
              if (context.workbook.worksheets.items.filter(f => f.name == "prophecy").length > 0) {
                let prophecy = context.workbook.worksheets.getItem("prophecy");
                let range_in = prophecy.getRange("A2:G100");
                range_in.load("values");
                let range_out = prophecy.getRange("I2:K100");
                range_out.load("values");
                return context.sync().then(function() {
                  let confs_in = range_in.values;
                  confs_in.forEach(conf => {
                    if (conf[1] != "") {
                      let [s, c] = conf[1].split("!");
                      let sheet = context.workbook.worksheets.getItem(s);
                      sheet.getRange(c).format.fill.color = "yellow";
                      randoms.push(conf[1]);
                    }
                  });
                  let confs_out = range_out.values;
                  confs_out.forEach(conf => {
                    if (conf[1] != "") {
                      let [s, c] = conf[1].split("!");
                      let sheet = context.workbook.worksheets.getItem(s);
                      sheet.getRange(c).format.fill.color = "red";
                      forecasts.push(conf[1]);
                    }
                  });
                });
              }
              else {
                let prophecy = context.workbook.worksheets.add("prophecy")
                range1 = prophecy.getRange("A1:G1");
                range1.values = [["name", "cell", "value", "distribution", "parameters", "", ""]];
                range1.format.borders.getItem('InsideHorizontal').style = 'Continuous';
                range1.format.borders.getItem('InsideVertical').style = 'Continuous';
                range1.format.borders.getItem('EdgeBottom').style = 'Continuous';
                range1.format.borders.getItem('EdgeLeft').style = 'Continuous';
                range1.format.borders.getItem('EdgeRight').style = 'Continuous';
                range1.format.borders.getItem('EdgeTop').style = 'Continuous';
                range1.format.fill.color = "yellow";
                range2 = prophecy.getRange("I1:K1");
                range2.values = [["name", "cell", "value"]];
                range2.format.borders.getItem('InsideHorizontal').style = 'Continuous';
                range2.format.borders.getItem('InsideVertical').style = 'Continuous';
                range2.format.borders.getItem('EdgeBottom').style = 'Continuous';
                range2.format.borders.getItem('EdgeLeft').style = 'Continuous';
                range2.format.borders.getItem('EdgeRight').style = 'Continuous';
                range2.format.borders.getItem('EdgeTop').style = 'Continuous';
                range2.format.fill.color = "red"
                prophecy.getRange("E1:G1").merge();
                return context.sync();
              }
          });
        });
      }
    });

async function workbookChange(event) {
    await Excel.run(async (context) => {
      let cell = context.workbook.getActiveCell();
      cell.load("address");
      return context.sync().then(function() {
        let address = cell.address
        if (randoms.includes(address)) {
          document.getElementById('input').checked = true;
        } else if (forecasts.includes(address)) {
          document.getElementById('output').checked = true;
        } else {
          document.getElementById('none').checked = true;
        }
      });
    });
}

async function radioChange(event) {
  await Excel.run(async (context) => {
    let sheet = context.workbook.worksheets.getActiveWorksheet();
    let cell = context.workbook.getActiveCell();
    let prophecy = context.workbook.worksheets.getItem("prophecy");
    cell.load("address");
    cell.load("values")
    cell.load("numberFormat")
    return context.sync().then(function() {
      let address = cell.address
      let idx = randoms.indexOf(address);
      let idx2 = forecasts.indexOf(address);
      if (document.getElementById('input').checked) {
          if (idx == -1) {
            randoms.push(address)
            let row = randoms.length
            prophecy.getCell(row, 0).values = [["input_" + row]]
            prophecy.getCell(row, 1).hyperlink = {
                textToDisplay: address,
                screenTip: "input_" + row,
                documentReference: address
                }
            prophecy.getCell(row, 2).values = cell.values
            prophecy.getCell(row, 2).numberFormat = cell.numberFormat
            prophecy.getCell(row, 4).numberFormat = cell.numberFormat
            prophecy.getCell(row, 5).numberFormat = cell.numberFormat
            prophecy.getCell(row, 6).numberFormat = cell.numberFormat
            prophecy.getCell(row, 3).dataValidation.rule = {
                  list: {
                    inCellDropDown: true,
                    source: "uniform,normal,triangular,binomial"
                  }
                };
          }
          if (idx2 != -1) {
            forecasts.splice(idx2, 1);
            let range = prophecy.getRange("I" + (2+idx2) + ":K" + (2+idx2));
            range.delete(Excel.DeleteShiftDirection.up);
          }
          cell.format.fill.color = "yellow"
      } else if (document.getElementById('output').checked) {
          if (idx != -1) {
            randoms.splice(idx, 1);
            let range = prophecy.getRange("A" + (2+idx) + ":G" + (2+idx));
            range.delete(Excel.DeleteShiftDirection.up);
          }
          if (idx2 == -1) {
            forecasts.push(address);
            let row = forecasts.length
            prophecy.getCell(row, 8).values = [["output_" + row]]
            prophecy.getCell(row, 9).hyperlink = {
                textToDisplay: address,
                screenTip: "output_" + row,
                documentReference: address
                }
            prophecy.getCell(row, 10).values = cell.values
          }
          cell.format.fill.color = "red"
      } else {
          if (idx != -1) {
            randoms.splice(idx, 1);
            let range = prophecy.getRange("A" + (2+idx) + ":G" + (2+idx));
            range.delete(Excel.DeleteShiftDirection.up);
          }
          if (idx2 != -1) {
            forecasts.splice(idx2, 1);
            let range = prophecy.getRange("I" + (2+idx2) + ":K" + (2+idx2));
            range.delete(Excel.DeleteShiftDirection.up);
          }
          cell.format.fill.clear();
      }
    });
  });
}

async function config(event) {
  await Excel.run(async (context) => {
    let prophecy = context.workbook.worksheets.getItem("prophecy");
    let cell = context.workbook.getActiveCell();
    cell.load("address");
    return context.sync().then(function() {
      prophecy.activate();
      let idx1 = randoms.indexOf(cell.address);
      if (idx1 != -1) {
        prophecy.getRange("A" + (2+idx1) + ":G" + (2+idx1)).select();
      } else {
        let idx2 = forecasts.indexOf(cell.address);
        if (idx2 != -1) {
          prophecy.getRange("I" + (2+idx2) + ":K" + (2+idx2)).select();
        }
      }
    });
  });
}

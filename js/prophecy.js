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
              if (context.workbook.worksheets.items.filter(f => f.name == sheet_name).length > 0) {
                let prophecy = context.workbook.worksheets.getItem(sheet_name);
                prophecy.getRange("E1:E100").format.columnWidth = 250;
                let range_in = prophecy.getRange("A2:E100");
                range_in.load("values");
                let range_out = prophecy.getRange("G2:I100");
                range_out.load("values");
                prophecy.onChanged.add(prophecyChange);
                return context.sync().then(function() {
                  let confs_in = range_in.values;
                  confs_in.forEach(conf => {
                    if (conf[1] != "") {
                      let [s, c] = conf[1].split("!");
                      let sheet = context.workbook.worksheets.getItem(s);
                      sheet.getRange(c).format.fill.color = color_output;
                      randoms.push(conf[1]);
                    }
                  });
                  let confs_out = range_out.values;
                  confs_out.forEach(conf => {
                    if (conf[1] != "") {
                      let [s, c] = conf[1].split("!");
                      let sheet = context.workbook.worksheets.getItem(s);
                      sheet.getRange(c).format.fill.color = color_input;
                      forecasts.push(conf[1]);
                    }
                  });
                });
              } else {
                let prophecy = context.workbook.worksheets.add(sheet_name)
                /*
                let table_in = prophecy.tables.add("A1:E1", true);
                table_in.name = "randoms";
                table_in.getHeaderRowRange().values = [["name", "cell", "value", "distribution", "parameters"]];
                let table_out = prophecy.tables.add("G1:I1", true);
                table_out.name = "forecasts";
                table_out.getHeaderRowRange().values = [["name", "cell", "value"]];
                const binding = context.workbook.bindings.add(table_in.getRange(), "Table", "randoms");
                binding.onDataChanged.add(onRandomsChanged);
                */
                range1 = prophecy.getRange("A1:E1");
                range1.values = [["name", "cell", "value", "distribution", "parameters"]];
                range1.format.borders.getItem('InsideHorizontal').style = 'Continuous';
                range1.format.borders.getItem('InsideVertical').style = 'Continuous';
                range1.format.borders.getItem('EdgeBottom').style = 'Continuous';
                range1.format.borders.getItem('EdgeLeft').style = 'Continuous';
                range1.format.borders.getItem('EdgeRight').style = 'Continuous';
                range1.format.borders.getItem('EdgeTop').style = 'Continuous';
                range1.format.fill.color = color_output;
                prophecy.getRange("E:E").format.ColumnWidth = 25;
                range2 = prophecy.getRange("G1:I1");
                range2.values = [["name", "cell", "value"]];
                range2.format.borders.getItem('InsideHorizontal').style = 'Continuous';
                range2.format.borders.getItem('InsideVertical').style = 'Continuous';
                range2.format.borders.getItem('EdgeBottom').style = 'Continuous';
                range2.format.borders.getItem('EdgeLeft').style = 'Continuous';
                range2.format.borders.getItem('EdgeRight').style = 'Continuous';
                range2.format.borders.getItem('EdgeTop').style = 'Continuous';
                range2.format.fill.color = color_input;
                prophecy.onChanged.add(prophecyChange);
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

async function prophecyChange(event) {
  await Excel.run(async (context) => {
    const address = event.address;
    const value = event.details.valueAfter
    if (address.charAt(0) == "D") {
      const row = parseInt(address.substring(1)) - 1;
      const prophecy = context.workbook.worksheets.getItem(sheet_name);
      const cell = prophecy.getCell(row, 4);
      switch (value) {
        case "uniform":
          cell.values = [["{\"min\":100, \"max\":200}"]];
          break;
        case "normal":
          cell.values = [["{\"mean\":100, \"stdev\":20}"]];
          break;
        case "triangular":
          cell.values = [["{\"min\":100, \"max\":200, \"mode\":125}"]];
          break;
        case "yes/no":
          cell.values = [["{\"yes\":0.5}"]];
          break;
        case "discrete":
          cell.values = [["[{\"v\":1, \"p\":0.4},{\"v\":2, \"p\":0.2},{\"v\":3, \"p\":0.4}]"]];
          break;
        case "custom":
          cell.values = [["[{\"l\":0, \"h\":1, \"p\":0.2},{\"l\":1, \"h\":2, \"p\":0.6},{\"l\":2, \"h\":3, \"p\":0.2}]"]];
          break;
      }
    }
    await context.sync();
  });
}

async function radioChange(event) {
  await Excel.run(async (context) => {
    let sheet = context.workbook.worksheets.getActiveWorksheet();
    let cell = context.workbook.getActiveCell();
    let prophecy = context.workbook.worksheets.getItem(sheet_name);
    // let table_in = sheet.tables.getItem("randoms");
    // let table_out = sheet.tables.getItem("forecasts");
    cell.load("address");
    cell.load("values");
    cell.load("numberFormat")
    return context.sync().then(function() {
      let address = cell.address
      let idx = randoms.indexOf(address);
      let idx2 = forecasts.indexOf(address);
      if (document.getElementById('input').checked) {
          if (idx == -1) {
            randoms.push(address)
            let row = randoms.length
            /*
            table_in.rows.add(null, [
              ["input_" + row,  "", cell.values[0][0], "", ""]
            ]);
            */
            prophecy.getCell(row, 0).values = [["input_" + row]];
            prophecy.getCell(row, 1).hyperlink = {
                textToDisplay: address,
                screenTip: "input_" + row,
                documentReference: address
                }
            prophecy.getCell(row, 2).values = cell.values
            prophecy.getCell(row, 2).numberFormat = cell.numberFormat
            prophecy.getCell(row, 3).dataValidation.rule = {
                  list: {
                    inCellDropDown: true,
                    source: distributions
                  }
                };
          }
          if (idx2 != -1) {
            forecasts.splice(idx2, 1);
            let range = prophecy.getRange("G" + (2+idx2) + ":I" + (2+idx2));
            range.delete(Excel.DeleteShiftDirection.up);
          }
          cell.format.fill.color = color_output
      } else if (document.getElementById('output').checked) {
          if (idx != -1) {
            randoms.splice(idx, 1);
            let range = prophecy.getRange("A" + (2+idx) + ":E" + (2+idx));
            range.delete(Excel.DeleteShiftDirection.up);
          }
          if (idx2 == -1) {
            forecasts.push(address);
            let row = forecasts.length
            prophecy.getCell(row, 6).values = [["output_" + row]]
            prophecy.getCell(row, 7).hyperlink = {
                textToDisplay: address,
                screenTip: "output_" + row,
                documentReference: address
                }
            prophecy.getCell(row, 8).values = cell.values
          }
          cell.format.fill.color = color_input
      } else {
          if (idx != -1) {
            randoms.splice(idx, 1);
            let range = prophecy.getRange("A" + (2+idx) + ":E" + (2+idx));
            range.delete(Excel.DeleteShiftDirection.up);
          }
          if (idx2 != -1) {
            forecasts.splice(idx2, 1);
            let range = prophecy.getRange("G" + (2+idx2) + ":I" + (2+idx2));
            range.delete(Excel.DeleteShiftDirection.up);
          }
          cell.format.fill.clear();
      }
    });
  });
}

async function config(event) {
  await Excel.run(async (context) => {
    let prophecy = context.workbook.worksheets.getItem(sheet_name);
    let cell = context.workbook.getActiveCell();
    cell.load("address");
    return context.sync().then(function() {
      prophecy.activate();
      let idx1 = randoms.indexOf(cell.address);
      if (idx1 != -1) {
        prophecy.getRange("A" + (2+idx1) + ":E" + (2+idx1)).select();
      } else {
        let idx2 = forecasts.indexOf(cell.address);
        if (idx2 != -1) {
          prophecy.getRange("G" + (2+idx2) + ":I" + (2+idx2)).select();
        }
      }
    });
  });
}

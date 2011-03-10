dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.themes.PlotKit.blue");


makeCharts = function() {
                var chart1 = new dojox.charting.Chart2D("simplechart");
                chart1.setTheme(dojox.charting.themes.PlotKit.blue);
                
                chart1.addPlot("default", {
                    type: "Lines"
                });
                chart1.addAxis("x");
                chart1.addAxis("y", {
                    vertical: true
                });
                chart1.addSeries("Series 1", [1, 2, 2, 3, 4, 5, 5, 7]);
                chart1.addSeries("Series 2", [11, 22, 22, 33, 44, 54, 54, 74]);
                
                chart1.render();
            };

/*
chrome.experimental.processes.onUpdated.addListener(function(processes) {
  console.debug(processes);
});
*/


function getAllTabsInWindow() {
  chrome.tabs.getAllInWindow(null, function(tabs){
    console.debug(tabs);
    // Display tab in list if it is in the same process
    tabs.forEach(function(tab) {
      chrome.experimental.processes.getProcessIdForTab(tab.id, function(pid){
          console.log(tab, pid);
      });
    });
  });
}

dojo.ready(function() {
  makeCharts();
  console.debug("--- ready ----");
  
  getAllTabsInWindow();

});
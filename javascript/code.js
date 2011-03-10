dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.themes.PlotKit.blue");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dijit.form.Button");
makeCharts = function(node) {
                var chart1 = new dojox.charting.Chart2D(node);
                
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
  // Get all tabs of the current window
  chrome.tabs.getAllInWindow(null, function(tabs){
    //console.debug(tabs);
    var tabList = {
      'identifier': 'processID',
      'label': 'tabTitle',
      'items': []
    };
    // Iterate tabs to build data model
    tabs.forEach(function(tab) {
      // Get process for each tab and build initial data model
      chrome.experimental.processes.getProcessIdForTab(tab.id, function(pid){
          console.log(tab, pid);
          tabList.items.push({
            'processID': pid,
            'tabTitle': tab.title,
          });
      });
    });
    console.debug(tabList);
  });
}

dojo.ready(function() {
  makeCharts("simplechart");
    makeCharts("simplechart2");
      makeCharts("simplechart3");
  console.debug("--- ready ----");
  
  getAllTabsInWindow();

});
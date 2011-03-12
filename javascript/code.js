dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dojox.charting.DataChart");
dojo.require("dojox.charting.themes.PlotKit.blue");
dojo.require("dojox.charting.DataSeries");
dojo.require("dojox.charting.axis2d.Default");
dojo.require("dojox.charting.plot2d.Lines");
dojo.require("dojox.charting.widget.Legend");

function debugDS(datastore) {
  var kwArgs = {
    query: {"processID":"*"},
    onComplete:function(items){
      console.debug(items);
    }
  };
  datastore.fetch(kwArgs);
}

// summary:
//  Main bootstrap
// callback: callback(tabsAndProcesses)
function getAllTabsInWindow(datastore, callback) {
  // Get all tabs of the current window
  chrome.tabs.getAllInWindow(null, function(tabs){
    // Iterate tabs to get process ID's
    var c = 0; // count process id request callbacks
    tabs.forEach(function(tab) {
      // Get process ID for each tab
      chrome.experimental.processes.getProcessIdForTab(tab.id, function(processId){
        //console.log(tab.title, processId);
        c++;
        // add item to datastore; Chrome sometimes reports duplicate process Id's (?)
        try {
          datastore.newItem({
            'processID'   : processId,
            'tabTitle'    : tab.tabTitle,
            'privateMemory'      : [],
            'sharedMemory'      : [],
            'cpu'         : [],
            'network'     : []
          });          
        } catch(e) {
          console.error("Error adding item", e);
        }
        // check for last getProcessIdForTab callback and execute callback param
        if (tabs.length===c) {
          callback();
        }
      });
    });
  });
}
// summary:
//  initialize datastore and create charts
function setupCharts(datastore) {
  var privateMemory = new dojox.charting.DataChart("privateMemoryChart",{
    //displayRange:20,
    title: "Private Memory",
    yaxis: {to: 1, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "privateMemory");
  
  var sharedMemory = new dojox.charting.DataChart("sharedMemoryChart",{
    //displayRange:20,
    title: "Shared Memory",
    yaxis: {to: 1, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "sharedMemory");
  
  var cpuChart = new dojox.charting.DataChart("cpuChart",{
    //displayRange:20,
    title: "CPU",
    yaxis: {to: 1, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "cpu");
  legend = new dojox.charting.widget.Legend({chart: cpuChart}, "legend");
  
  var networkChart = new dojox.charting.DataChart("networkChart",{
    //displayRange:20,
    title: "Network",
    yaxis: {to: 10, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "network");
  
}

// summary:
// updates a stat property on a datastore item
function _updateStatProperty(datastore, item, property, value) {
  var newValue, oldValue = datastore.getValues(item, property);
  oldValue.push(value);
  newValue = oldValue;
  if (newValue.length>10) {
    newValue.shift();
  }
  console.dir(newValue);
  datastore.setValues(item, property, newValue);  
}

// summary:
// 
function _onUpdated(processes) {
  //console.debug(processes);
  //debugDS(datastore);
  var process;
  for (pid in processes) {
    //console.debug(processes[pid]);
    process = processes[pid];
    datastore.fetchItemByIdentity({
      identity: pid,
      onItem: function(item) {
        if(datastore.isItem(item)){
          //console.debug("Got item", item);
          _updateStatProperty(datastore, item, 'cpu', process.cpu);
          _updateStatProperty(datastore, item, 'privateMemory', process.privateMemory);
          _updateStatProperty(datastore, item, 'sharedMemory', process.sharedMemory);
          _updateStatProperty(datastore, item, 'network', process.network);
        } else {
          //console.error("item is not datastore item:", item);
        }
      },
      onError: function(error) {
        //console.error("Error fetching item by id:", error);
      }
     });
  };
}

var datastore; // FIXME: global (on the run atm)

// summary:
//  execute on page loaded
dojo.ready(function() {
  console.debug("--- ready ----");
  var initialData = {
      'identifier': 'processID',
      'idAttribute': 'processID',
      'label': 'tabTitle',
      'items': []
    };
  datastore = new dojo.data.ItemFileWriteStore({data: initialData});
  //, setupCharts
  getAllTabsInWindow(datastore, function(){
    //debugDS(datastore);
    // Setup the charts
    setupCharts(datastore);
    // Start drawing 2xRainbows
    chrome.experimental.processes.onUpdated.addListener(_onUpdated);
  });
  
});
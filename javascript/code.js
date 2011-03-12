dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dojox.charting.DataChart");
dojo.require("dojox.charting.themes.PlotKit.blue");
dojo.require("dojox.charting.DataSeries");
dojo.require("dojox.charting.axis2d.Default");
dojo.require("dojox.charting.plot2d.Lines");

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
            'memory'      : [],
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
  var memoryChart = new dojox.charting.DataChart("memoryChart",{
    //displayRange:20,
    title: "Memory",
    yaxis: {to: 10, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "memory");
  
  var cpuChart = new dojox.charting.DataChart("cpuChart",{
    //displayRange:20,
    title: "CPU",
    yaxis: {to: 100, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "cpu");
  
  var networkChart = new dojox.charting.DataChart("networkChart",{
    //displayRange:20,
    title: "Network",
    yaxis: {to: 10, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "network");
  
}

// summary:
// 
function _updateStatProperty(datastore, item, property, value) {
  var oldValue = datastore.getValues(item, property);
  oldValue.push(value);
  //newValue = oldValue.slice(0, 10);
  newValue = oldValue;
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
          _updateStatProperty(datastore, item, 'memory', process.memory);
          _updateStatProperty(datastore, item, 'network', process.network);
          console.debug(item.cpu);
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
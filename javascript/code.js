dojo.require("dojo.data.ItemFileWriteStore");
dojo.require("dojox.charting.DataChart");
dojo.require("dojox.charting.themes.PlotKit.blue");
dojo.require("dojox.charting.DataSeries");
dojo.require("dojox.charting.axis2d.Default");
dojo.require("dojox.charting.plot2d.Lines");
dojo.require("dojox.charting.widget.Legend");

dojo.require("dijit.form.Button");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.layout.BorderContainer");

dojo.require("dojox.grid.DataGrid");

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
            'processID'     : processId,
            'tabTitle'      : tab.title,
            'privateMemory' : [],
            'sharedMemory'  : [],
            'cpu'           : [],
            'network'       : []
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
  
  var cpuChart = new dojox.charting.DataChart("cpuChart",{
    //displayRange:20,
    title: "CPU",
    yaxis: {to: 100, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true, natural:false, minorTicks:false},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "cpu");
  legend = new dojox.charting.widget.Legend({chart: cpuChart}, "legend");
  
  var privateMemory = new dojox.charting.DataChart("privateMemoryChart",{
    //displayRange:20,
    title: "Private Memory",
    yaxis: {to: 100000000, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true, majorTickStep:10000000, minorTicks:false},
    type: dojox.charting.plot2d.Lines
  }).setStore(datastore, {processID:"*"}, "privateMemory");
  
//  var sharedMemory = new dojox.charting.DataChart("sharedMemoryChart",{
//    //displayRange:20,
//    title: "Shared Memory",
//    yaxis: {to: 50000000, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
//    type: dojox.charting.plot2d.Lines
//  }).setStore(datastore, {processID:"*"}, "sharedMemory");

  
//  var networkChart = new dojox.charting.DataChart("networkChart",{
//    //displayRange:20,
//    title: "Network",
//    yaxis: {to: 10, vertical: true, fixLower: "major", fixUpper: "major", includeZero: true,natural:true},
//    type: dojox.charting.plot2d.Lines
//  }).setStore(datastore, {processID:"*"}, "network");
  
}

// summary:
//  setup the datagrid
function setupDatagrid(datastore) {
  var datagrid = dijit.byId("processesGrid");
  datagrid.setStore(datastore);
  //console.debug(datagrid);
}

// summary:
// updates a stat property on a datastore item
function _updateStatProperty(datastore, item, property, value) {
  var newValue, oldValue = datastore.getValues(item, property);
  oldValue.push(value);
  newValue = oldValue;
  // Math.round(0.02809176312906632*100)/100
  if (newValue.length>10) {
    newValue.shift();
  }
  //console.log("Property:", property, newValue);
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
          var cpu = Math.round(process.cpu*1000)/1000; // float, 0-100
          var privateMemory = process.privateMemory; // bytes
          var sharedMemory =  process.sharedMemory;  // bytes
          var network = process.network; // bytes
          
          _updateStatProperty(datastore, item, 'cpu', cpu);
          _updateStatProperty(datastore, item, 'privateMemory', privateMemory);
          _updateStatProperty(datastore, item, 'sharedMemory', sharedMemory);
          _updateStatProperty(datastore, item, 'network', network);
          
          //debugDS(datastore);
          
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
//chrome.tabs.create({"url":"https://chrome.google.com/webstore", "selected":true});window.close();

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
    debugDS(datastore);

    // Setup the charts
    setupCharts(datastore);
    
    // Setup the datagrid
    setupDatagrid(datastore);
    // Start drawing 2xRainbows
    chrome.experimental.processes.onUpdated.addListener(_onUpdated);
  });
  
});


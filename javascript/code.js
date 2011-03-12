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
function setupCharts(tabsAndProcesses) {
  var initialData = {
    'identifier': 'processID',
    'idAttribute': 'processID',
    'label': 'tabTitle',
    'items': []
  };
  var datastore = new dojo.data.ItemFileWriteStore({data: initialData});
  // fill datastore items
  console.debug(tabsAndProcesses[0]);
  for(var i=0; i<tabsAndProcesses.length; i++){
    console.debug(tabsAndProcesses[i]);
  }
  
  dojo.forEach(tabsAndProcesses, function(obj){
    
    datastore.newItem({
      'processID'   : obj.processId,
      'tabTitle'    : obj.tab.tabTitle,
      'memory'      : [],
      'cpu'         : [],
      'network'     : []
    });
  });  
}

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
  var datastore = new dojo.data.ItemFileWriteStore({data: initialData});
  //, setupCharts
  getAllTabsInWindow(datastore, function(){
    debugDS(datastore);  
  });
  
});
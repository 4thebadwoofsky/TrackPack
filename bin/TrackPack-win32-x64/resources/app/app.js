const electron = require('electron');
const {app, BrowserWindow, Menu, ipcMain} = electron;
const path = require('path');
const url = require('url');

var _DB = require('nedb'), DB = new _DB({ filename: 'database.nedb', autoload: true });
DB.loadDatabase();
var TrackingInterface = {
    Register: function(trackingID,paketDienst) {
        console.log("adding tracking id ["+trackingID+"("+paketDienst+")]");
        mainWindow.webContents.send('item:add',paketDienst,trackingID);
    }
};
var DBInterface = {
    Load: function(){
        DB.count({},function(error,cnt){
            console.log("Database Size == " + cnt);
        });
        DB.find({},function(error, data){
            data.forEach(function(val,index){
                TrackingInterface.Register(val.trackingID,val.paketDienst);
            });
        });
    }
};
let mainWindow;
let addTrackingIDWindow;

app.on('ready', function(){
  mainWindow = new BrowserWindow({});
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname,'resources', 'mainWindow.html'),
    protocol: 'file:',
    slashes:true
  }));
  mainWindow.on('closed', function(){
    app.quit();
  });
  mainWindow.setResizable(false);
  mainWindow.center();
  mainWindow.setMenuBarVisibility(false);
});

function createAddTrackingIDWindow() {
  addTrackingIDWindow = new BrowserWindow({
    width: 300,
    height: 380,
    title: 'Tracking-Nummer',
    parent: mainWindow,
    show: false,
    modal: true,
    alwaysOnTop:true,
    resizable: false,
  });
  addTrackingIDWindow.setMenuBarVisibility(false);
  addTrackingIDWindow.once('ready-to-show', () => { addTrackingIDWindow.show() });
  addTrackingIDWindow.loadURL(url.format({
    pathname: path.join(__dirname,'resources', 'addTrackingIDWindow.html'),
    protocol: 'file:',
    slashes: true
  }));
  addTrackingIDWindow.on('close', function(){ //GC
    addTrackingIDWindow = null;
  });
}
ipcMain.on('db:load', function(e){
    DBInterface.Load();
});
ipcMain.on('item:create', createAddTrackingIDWindow);
ipcMain.on('item:add', function(e,paketDienst,trackingID){
    if (paketDienst == "") return false;
    if ((trackingID + '').length < 5) return false; 

    DB.insert({
        trackingID: trackingID,
        paketDienst: paketDienst
    }, function (err, newDocs) {
        if(err == undefined) {
          TrackingInterface.Register(trackingID,paketDienst);
          addTrackingIDWindow.close();
        }
    });
});
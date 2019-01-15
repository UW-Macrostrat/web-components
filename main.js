import {BrowserWindow, app} from 'electron';

let createWindow = function() {
  let win = new BrowserWindow();
  win.loadURL(`file://${__dirname}/app/index.html`);
  win.on('closed', function() {
    win = null;
  });
};

app.on('ready', createWindow);
app.on('window-all-closed', function(){ app.quit() });


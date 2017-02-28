{BrowserWindow, app} = require 'electron'
shortcuts = require './sections/shortcuts'

mainWindow = null

createWindow = ->
  mainWindow = new BrowserWindow width: 800, height: 600
  global.BROWSER_SYNC_URL = process.env["BROWSER_SYNC_URL"]
  mainWindow.loadURL "file://#{__dirname}/sections/index.html"

  mainWindow.on 'closed', ->
    mainWindow = null

  shortcuts(mainWindow)

app.on 'ready', createWindow
app.on 'window-all-closed', -> app.quit()


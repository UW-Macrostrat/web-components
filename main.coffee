{BrowserWindow, app} = require 'electron'
reload = require 'electron-reload'

shortcuts = require './app/sections/shortcuts'

# Could make this better
reload(process.cwd())

createWindow = ->
  win = new BrowserWindow
  win.loadURL "file://#{__dirname}/app/index.html"
  win.on 'closed', ->
    win = null

  shortcuts(win)

app.on 'ready', createWindow
app.on 'window-all-closed', -> app.quit()

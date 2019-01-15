{BrowserWindow, app} = require 'electron'
path = require 'path'
#{default: installExtension
# REACT_DEVELOPER_TOOLS} = require('electron-devtools-installer')

#name = path.join process.env.REPO_DIR,"tile-server","run-server"
#tessera = spawn name

createWindow = ->
  await installExtension REACT_DEVELOPER_TOOLS

  win = new BrowserWindow
  win.loadURL "file://#{__dirname}/app/index-test.html"
  win.on 'closed', ->
    win = null

app.on 'ready', createWindow
app.on 'window-all-closed', -> app.quit()

#app.on 'quit', (d)->
  #console.log "Killing map server"
  #tessera.kill('SIGINT')

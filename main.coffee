{BrowserWindow, app} = require 'electron'
reload = require 'electron-reload'
path = require 'path'
{spawn} = require 'child_process'
{default: installExtension
 REACT_DEVELOPER_TOOLS} = require('electron-devtools-installer')

# Could make this better
reload([
  process.cwd()
  path.join(process.env.REPO_DIR,'deps','node')
])

#name = path.join process.env.REPO_DIR,"tile-server","run-server"
#tessera = spawn name

createWindow = ->
#  await installExtension REACT_DEVELOPER_TOOLS

  win = new BrowserWindow
  win.loadURL "file://#{__dirname}/app/index.html"
  win.on 'closed', ->
    win = null

app.on 'ready', createWindow
app.on 'window-all-closed', -> app.quit()

#app.on 'quit', (d)->
  #console.log "Killing map server"
  #tessera.kill('SIGINT')

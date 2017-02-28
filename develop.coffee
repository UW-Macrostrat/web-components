{spawn} = require 'child_process'
{create} = require 'browser-sync'
{clientScript} = require 'browser-sync/lib/connect-utils'
chalk = require 'chalk'

port = 35729

cfg =
  ui: false
  files: [
    'app/**/*.coffee',
    'app/**/*.styl'
    ]
  open: false
  port: port
  socket:
    domain: "http://localhost:#{port}"

getClientUrl = (opts) ->
  pathname = clientScript(opts)
  "#{cfg.socket.domain}#{pathname}"

prefix = "[#{chalk.blue("Electron")}] "
print = (data)->
  data = data.toString('utf8')
  console.log prefix+data.slice(0,data.length-1)

bs = create()
bs.init cfg, (err,bs)=>
  process.env["BROWSER_SYNC_URL"] = getClientUrl(bs.options)
  process.env["NODE_ENV"] = 'development'
  child = spawn 'electron', ['index.js'], cwd: 'app'

  print "Starting application "
  process.on 'exit', ->
    child.kill 'SIGINT'
  child.on 'exit',(code, signal)->
    print "Exiting... "
    process.exit 0

  child.stdout.on "data", print
  child.stderr.on "data", print


{createContext} = require 'react'

## Set whether we are on the backend or frontend
global.ELECTRON = 'electron'
global.WEB = 'web'
global.PLATFORM = ELECTRON
global.SERIALIZED_QUERIES = false
try
  require 'electron'
  {resolve, join} = require 'path'
  global.BASE_DIR = resolve join(__dirname,'..')
catch
  global.PLATFORM = WEB
  global.SERIALIZED_QUERIES = true
  global.BASE_URL = ""
console.log "Running application on #{PLATFORM}"

Platform = Object.freeze {
  DESKTOP: 1
  WEB: 2
  PRINT: 3
}

PlatformContext = createContext {
  platform: Platform.DESKTOP
  editable: true
}

module.exports = {PlatformContext, Platform}

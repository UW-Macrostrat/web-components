{createContext} = require 'react'

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

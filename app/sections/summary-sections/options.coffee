{createContext} = require 'react'

defaultSectionOptions = {
  showFacies: true
  skeletal: false
}

SectionOptionsContext = createContext {
  defaultSectionOptions...
  pixelsPerMeter: 2
  marginLeft: -10
  triangleBarsOffset: 80
  padding: {
    left: 30
    top: 10
    right: 20
    bottom: 10
  }
}

module.exports = {SectionOptionsContext, defaultSectionOptions}

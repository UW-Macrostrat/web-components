{SettingsPanel} = require '../settings'
{FaciesDescriptionSmall} = require '../facies-descriptions'
h = require 'react-hyperscript'

class SummarySectionsSettings extends SettingsPanel
  renderControls: =>
    return [
      h 'h5', "Components"
      @createSwitch 'showCarbonIsotopes', "Carbon isotopes"
      @createSwitch 'showFloodingSurfaces', "Sequence boundaries"
      @createSwitch 'showSymbols', 'Symbols'
      @createSwitch 'showFacies', 'Facies'
      @createSwitch 'showLegend', 'Legend'
      h 'hr'
      @createSwitch 'serializedQueries', "Serialized queries"
      h 'hr'
      h 'h5', 'Display mode'
      @createPicker 'modes', 'activeMode'
      h FaciesDescriptionSmall, {}, null
    ]

module.exports = {SummarySectionsSettings}

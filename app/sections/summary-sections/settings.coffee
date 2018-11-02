{SettingsPanel} = require '../settings'
{FaciesDescriptionSmall} = require '../facies-descriptions'
{Button} = require "@blueprintjs/core"
h = require 'react-hyperscript'

class SummarySectionsSettings extends SettingsPanel
  @defaultProps: {
    reloadCorrelations: ->
  }
  renderControls: =>
    return [
      h 'h5', "Components"
      @createSwitch 'showCarbonIsotopes', "Carbon isotopes"
      @createSwitch 'showOxygenIsotopes', "Oxygen isotopes"
      @createSwitch 'showLithostratigraphy', "Lithostratigraphic correlations"
      @createSwitch 'showSequenceStratigraphy', "Sequence-stratigraphic correlations"
      @createSwitch 'showSymbols', 'Symbols'
      @createSwitch 'showFacies', 'Facies'
      @createSwitch 'showLegend', 'Legend'
      h 'hr'
      h 'h5', 'Sequence stratigraphy'
      @createSwitch 'showFloodingSurfaces', "Flooding surfaces"
      @createSwitch 'showTriangleBars', "Triangle bars"
      h 'hr'
      @debuggingControls()...
      h 'h6', 'Display mode'
      @createPicker 'modes', 'activeMode'
    ]

class GeneralizedSectionsSettings extends SettingsPanel
  renderControls: =>
    return [
      @createSwitch 'showSequenceStratigraphy', 'Sequence-stratigraphic correlations'
      @debuggingControls()...
    ]

module.exports = {SummarySectionsSettings, GeneralizedSectionsSettings}

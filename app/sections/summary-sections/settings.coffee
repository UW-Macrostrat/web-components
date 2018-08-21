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
      @createSwitch 'serializedQueries', "Serialized queries"
      h 'hr'
      h 'h5', 'Display mode'
      @createPicker 'modes', 'activeMode'
      h 'h5', 'Actions'
      h Button, {onClick: @props.reloadCorrelations}, 'Reload correlations'
    ]

class GeneralizedSectionsSettings extends SettingsPanel
  renderControls: =>
    return [
      @createSwitch 'showSequenceStratigraphy', 'Sequence-stratigraphic correlations'
      h 'h5', 'Display mode'
      @createPicker 'modes', 'activeMode'
    ]

module.exports = {SummarySectionsSettings, GeneralizedSectionsSettings}

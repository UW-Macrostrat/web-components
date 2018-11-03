{SettingsPanel} = require '../settings'
{FaciesDescriptionSmall} = require '../facies-descriptions'
{Button, Silder} = require "@blueprintjs/core"
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
      @sequenceStratControls()
      @debuggingControls()
      h 'h6', 'Display mode'
      @createPicker 'modes', 'activeMode'
    ]

class GeneralizedSectionsSettings extends SettingsPanel
  @defaultProps: {
    exportSVG: ->
  }
  renderControls: =>
    return [
      @createSwitch 'showSequenceStratigraphy', 'Sequence-stratigraphic correlations'
      @createSwitch 'showSimplifiedLithology', 'Simplified lithology'
      @createSwitch 'showFacies', 'Facies'
      @createSwitch 'showFaciesTracts', 'Facies tracts'
      @sequenceStratControls()
      @debuggingControls()
      h Button, {onClick: @props.exportSVG}, 'Export SVG'
    ]

module.exports = {SummarySectionsSettings, GeneralizedSectionsSettings}

import {SettingsPanel} from "../settings"
import {FaciesDescriptionSmall} from "../facies"
import {Button, Silder} from "@blueprintjs/core"
import h from "react-hyperscript"

class SummarySectionsSettings extends SettingsPanel
  @defaultProps: {
    reloadCorrelations: ->
  }

  renderControls: =>
    return [
      h 'h5', "Components"
      @createSwitch 'showCarbonIsotopes', "Carbon isotopes"
      @createSwitch 'showOxygenIsotopes', "Oxygen isotopes"
      @createSwitch 'isotopesPerSection', "Show isotopes for each section"
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
      @createSwitch 'showLithology', 'Simplified lithology'
      @createSwitch 'showFacies', 'Facies'
      @createSwitch 'showFaciesTracts', 'Facies tracts'
      @sequenceStratControls()
      @debuggingControls()
      h Button, {onClick: @props.exportSVG}, 'Export SVG'
    ]

export {SummarySectionsSettings, GeneralizedSectionsSettings}

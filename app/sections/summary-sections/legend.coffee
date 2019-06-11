import {Component} from "react"
import h from "react-hyperscript"
import classNames from "classnames"
import {SymbolLegend} from "../column/symbol-column"
import {FaciesDescriptionSmall, FaciesContext, FaciesSwatch} from "../facies"

class FaciesLegend extends Component
  @defaultProps: {
    facies: []
    onChanged: ->
    isEditable: true
  }
  render: ->
    h 'div.legend-inner', [
      h 'div.facies-description', [
        h 'h2', 'Sedimentary facies'
        h 'div.facies-description-inner', [
          h 'div.section', [
            h 'h4', 'Siliciclastic'
            @facies "coarse-clastics", "Coarse sandstone and pebble conglomerate"
            @facies "shallow-fine-clastics", "Inner shoreface sandstone–siltstone"
            @facies "fine-clastics", "Outer shoreface sandstone–mudstone"
          ]
          h 'div.section', [
            h 'h4', 'Carbonate'
            @facies "knobbly-stromatolites", "Stromatolite-colonized reworking surface*"
            @facies "carbonate-mudstone"
            @facies "intraclast-grainstone"
            @facies "hcs-grainstone", "Cross-stratified grainstone"
            @facies "mixed-grainstone", 'Wavy-bedded heterolithic'
            @facies "intraclast-breccia", 'Intraclast breccia'
            h 'p.note', "*: not a stratigraphically continuous facies"
          ]
        ]
      ]
      h 'div.symbol-legend', [
        h 'h2', 'Symbology'
        h SymbolLegend
        h 'p.note', 'Triangle bars represent variation in accomodation space at the parasequence set level'
      ]
    ]

  facies: (id, title=null)->
    {selected, facies} = @props
    d = facies.find (d)->d.id == id
    return null if not d?
    style = {}
    if selected == d.id
      style.backgroundColor = d.color
      style.color = 'white'
    className = classNames({selected: selected == d.id})

    h 'div.facies', {
      key: d.id, style, className
    }, [
      h 'div.header', [
        h 'p.name', title or d.name
        h FaciesSwatch, {facies: d}
      ]
    ]

class Legend extends Component
  render: ->
    h 'div.legend#summary-sections-legend', {
      style: {
        position: 'absolute'
        left: 500
        top: 25
      }
    },
    [
      h FaciesContext.Consumer, null, (props)=>
        h FaciesLegend, props
    ]

export {Legend}

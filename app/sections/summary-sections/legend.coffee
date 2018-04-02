{Component} = require 'react'
h = require 'react-hyperscript'
classNames = require 'classnames'
{FaciesDescriptionSmall, FaciesContext} = require '../facies-descriptions'

class FaciesLegend extends FaciesDescriptionSmall
  @defaultProps: {
    facies: []
    onChanged: ->
    isEditable: true
  }
  render: ->
    h 'div.facies-description', [
      h 'h2', 'Facies'
      h 'div.section', [
        h 'h4', 'Siliciclastic'
        @facies "coarse-clastics"
        @facies "shallow-fine-clastics"
        @facies "fine-clastics"
      ]
      h 'div.section', [
        h 'h4', 'Carbonate grainstone'
        @facies "intraclast-grainstone"
        @facies "hcs-grainstone"
        @facies "mixed-grainstone"
        @facies "wavy-grainstone"
      ]
      h 'div.section', [
        h 'h4', 'Carbonate mudstone'
        @facies "shallow-carbonate"
        @facies "carbonate-mudstone"
        @facies "intraclast-breccia"
      ]
      h 'div.section', [
        h 'h4', 'Other'
        @facies "knobbly-stromatolites"
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
        @renderFaciesSwatch(d)
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

module.exports = {Legend}

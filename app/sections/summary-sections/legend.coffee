{Component} = require 'react'
h = require 'react-hyperscript'
classNames = require 'classnames'
{FaciesDescriptionSmall} = require '../facies-descriptions'

class FaciesLegend extends FaciesDescriptionSmall
  render: ->
    h 'div.facies-description', [
      h 'h4', 'Facies'
      h 'div.group', [
        h 'h5', 'Clastic'
        @facies "coarse-clastics"
        @facies "shallow-fine-clastics"
        @facies "fine-clastics"
      ]
      h 'div.group', [
        h 'h5', 'Carbonate grainstone'
        @facies "intraclast-grainstone"
        @facies "hcs-grainstone"
        @facies "mixed-grainstone"
        @facies "wavy-grainstone"
      ]
      h 'div.group', [
        h 'h5', 'Carbonate mudstone'
        @facies "shallow-carbonate"
        @facies "carbonate-mudstone"
        @facies "intraclast-breccia"
      ]
      h 'div.group', [
        h 'h5', 'Other'
        @facies "knobbly-stromatolites"
      ]
    ]

  facies: (id)->
    d = @state.facies.find (d)->d.id == id
    return null if not d?
    style = {}
    {selected} = @props
    if selected == d.id
      style.backgroundColor = d.color
      style.color = 'white'
    className = classNames({selected: selected == d.id})

    h 'div.facies', {
      key: d.id, style, className
    }, @renderFacies(d)

class Legend extends Component
  render: ->
    h 'div.legend', [
      h 'h2', 'Legend'
      h FaciesLegend
    ]

module.exports = {Legend}

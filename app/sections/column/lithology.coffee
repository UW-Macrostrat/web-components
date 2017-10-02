{query} = require '../db'
{select} = require 'd3-selection'
{Component} = require 'react'
h = require 'react-hyperscript'

symbolIndex =
  'dolomite-limestone': 641
  'lime_mudstone': 627
  'sandstone': 607
  'siltstone': 616
  'shale': 620
  'limestone': 627
  'dolomite': 642
  'conglomerate': 602
  'dolomite-mudstone': 642
  'mudstone': 620
  'sandy-dolomite': 645

resolveSymbol = (d)->
  if d.fgdc_pattern?
    id = d.fgdc_pattern
  else
    id = symbolIndex[d.pattern]
  try
    q = require.resolve "geologic-patterns/assets/png/#{id}.png"
    return 'file://'+q
  catch
    return ''

class LithologyColumn extends Component
  constructor: (props)->
    super props
    @state =
      divisions: []
    query 'lithology', [@props.id]
      .then (data)=>
        data.reverse()
        @setState divisions: data

  render: ->
    {style, scale, visible} = @props
    divisions = if visible then @state.divisions else []
    h 'div.lithology-column', {style},
      divisions.map (d)->
        classes = '.lithology'
        classes += '.definite' if d.definite_boundary
        classes += '.covered' if d.covered

        y = scale(d.top)
        height = scale(d.bottom)-y

        fn = resolveSymbol d

        style = {
          position: 'absolute'
          top: y
          height: height + 2# A little overlap
          'backgroundImage': "url(#{fn})"
          'backgroundSize': '100px 100px'
        }

        h "span#{classes}", {style}


module.exports = LithologyColumn

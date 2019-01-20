
# https://pomax.github.io/bezierjs/
# http://jsfiddle.net/halfsoft/Gsz2a/

import {Component} from 'react'
import {findDOMNode} from 'react-dom'
import h from 'react-hyperscript'
import {SVGComponent, SectionNavigationControl} from '../util'
import {path} from 'd3-path'
import {select} from 'd3-selection'
import {readFileSync} from 'fs'
import {join} from 'path'
import polygonize from '@turf/polygonize'
import {db, storedProcedure} from '../db'

removeALine = (f)->
  f.substring(f.indexOf("\n") + 1)

coordAtLength = (path, pos)->
  {x,y} = path.getPointAtLength(pos)
  x = Math.round(x*10)/10
  y = Math.round(y*10)/10
  [x,y]

class RegionalCrossSectionPage extends Component
  constructor: ->
    super arguments...
    @state = {polygons: null}

  componentDidMount: ->
    fn = join __dirname, "stratigraphic-model.svg"
    svg = readFileSync fn
    fst = svg.toString()
    v = removeALine(removeALine(fst))
    el = select findDOMNode @
    pathData = []

    el.select("div.regional-cross-section").html v
    main = el.select "svg g#Main"

    main.selectAll 'path,polygon'
      .each ->
        len = @getTotalLength()
        return if len == 0
        pos = 0
        coordinates = []
        while pos < len
          coordinates.push coordAtLength(@,pos)
          pos += 0.1
        coordinates.push coordAtLength(@,len)
        pathData.push coordinates

    @getPolygons(pathData)

  getPolygons: (pathData)->
    sql = storedProcedure "get-generalized", {
      baseDir: join(__dirname)
    }
    res = await db.query sql, {
      geometry: {
        coordinates: pathData,
        type: 'MultiLineString'
      }
    }
    console.log res
    #@setState {polygons: geometry}

  render: ->
    h 'div', [
      h SectionNavigationControl
      h 'div.regional-cross-section'
    ]

export {RegionalCrossSectionPage}


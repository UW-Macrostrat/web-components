
# https://pomax.github.io/bezierjs/
# http://jsfiddle.net/halfsoft/Gsz2a/

import {Component} from 'react'
import {findDOMNode} from 'react-dom'
import h from 'react-hyperscript'
import {SVGComponent, SectionNavigationControl} from '../util'
import {path} from 'd3-path'
import {schemeSet3} from 'd3-scale-chromatic'
import {geoPath, geoTransform} from 'd3-geo'
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

proj = geoTransform {
  point: (px, py)-> @stream.point(px, py)
}
generator = geoPath().projection proj

PolygonComponent = (props)->
  {polygons} = props
  return null unless polygons?
  h 'g.polygons', [
    polygons.map (p, i)->
      fill = schemeSet3[i%12]
      h 'path', {d: generator(p.geometry), key: i, fill}
  ]


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

    tcs = el.select("div.temp-cross-section")
    tcs.html v
    svg = tcs.select "svg"

    main = svg.select("g#Main")

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

    cs = el.select("svg.cross-section")
      .attr "viewBox", svg.attr("viewBox")
    cs.select("g.linework")
      .node().appendChild main.node()

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
    @setState {polygons: res}

  render: ->
    {polygons} = @state
    h 'div', [
      h SectionNavigationControl
      h SVGComponent, {className: 'cross-section'}, [
        h PolygonComponent, {polygons}
        h 'g.linework'
      ]
      h 'div.temp-cross-section'
    ]

export {RegionalCrossSectionPage}



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
import {db, storedProcedure} from '../db'
import './main.styl'
import {PlatformContext} from '../../platform'

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

facies_ix = {
  shale: [620, '#DCEDC8']
  gs: [627, '#4A148C']
  ms: [642, '#BBDEFB']
  cc: [601,'#006064']
  fc: [669,'#4DB6AC']
}

class PolygonComponent extends Component
  @contextType: PlatformContext
  renderDefs: ->
    {resolveLithologySymbol} = @context
    patternSize = {width: 30, height: 30}
    patterns = Object.values(facies_ix)
    patternLoc = {x:0,y:0}

    h 'defs', patterns.map (d)->
      id = "pattern-#{d[0]}"
      h 'pattern', {
        id
        key: id
        patternUnits: "userSpaceOnUse"
        patternSize...
      }, [
        h 'rect', {
          fill: d[1]
          patternSize...
          patternLoc...
        }
        h 'image', {
          xlinkHref: resolveLithologySymbol(d[0], {svg: true})
          patternLoc...
          patternSize...
        }
      ]

  render: ->
    {polygons} = @props
    return null unless polygons?
    h 'g.polygon-container', [
      @renderDefs()
      h 'g.polygons', polygons.map (p, i)->
        {facies_id, geometry} = p
        fill = schemeSet3[i%12]
        if facies_id?
          fill = "url(#pattern-#{facies_ix[facies_id][0]})"
        h 'path', {d: generator(geometry), key: i, fill}
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

    ### Get path data ###
    main.selectAll 'path,line,polygon,polyline'
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

    pts = svg.select("g#Labels")
    cs.select("g.overlay")
      .node().appendChild(pts.node())

    ### Get facies data ###
    points = []
    facies = svg.select("g#Facies")
    facies.selectAll 'text'
      .each ->
        faciesID = select(@).text()
        {x,y,width,height} = @getBBox()
        console.log y,height
        {e,f} = @transform.baseVal[0].matrix
        loc = [e+x+width/2,f+y+height/2]
        geometry = {coordinates: loc, type: "Point"}
        points.push {type: 'Feature', id: faciesID, geometry}

    svg.remove()

    @getPolygons(pathData, points)

  getPolygons: (pathData, points)->
    sql = storedProcedure "get-generalized", {
      baseDir: join(__dirname)
    }
    res = await db.query sql, {
      geometry: {
        coordinates: pathData,
        type: 'MultiLineString'
      }
      points
    }
    @setState {polygons: res}

  render: ->
    {polygons} = @state
    h 'div', [
      h SectionNavigationControl
      h SVGComponent, {className: 'cross-section'}, [
        h PolygonComponent, {polygons}
        h 'g.linework'
        h 'g.overlay'
      ]
      h 'div.temp-cross-section'
    ]

export {RegionalCrossSectionPage}


import hyper from '@macrostrat/hyper'
import React, {Component, useContext, createElement} from 'react'
import {APIResultView} from '@macrostrat/ui-components'
import {min, max} from 'd3-array'
import {select} from 'd3-selection'
import {geoStereographic, geoTransform} from 'd3-geo'
import {ResizeSensor, Popover, Spinner} from '@blueprintjs/core'
import {RotationsContext} from './rotations'
import {Globe, MapContext} from './globe'
import {geoPath} from 'd3-geo'
import {MapCanvasContext, CanvasLayer} from './globe/canvas-layer'
import {MapSettingsContext} from './map-settings'
import chroma from 'chroma-js'

import styles from './main.styl'

h = hyper.styled(styles)

FeatureLayer = (props)->
  {useCanvas, rest...} = props
  useCanvas ?= true
  if useCanvas
    return h CanvasLayer, rest
  return h 'g', rest

PlateFeature = (props)->
  # An arbitrary feature tied to a plate
  {feature, youngLim, oldLim, plateId, rest...} = props
  # Filter out features that are too young
  {geographyRotator, time} = useContext(RotationsContext) or {}
  return null unless geographyRotator?
  return null if oldLim < time
  # Filter out features that are too old (unlikely given current models)
  return null if youngLim > time
  {projection} = useContext(MapContext)
  rotate = geographyRotator plateId

  trans = geoTransform {
    point: (lon,lat)->
      [x,y] = rotate [lon,lat]
      this.stream.point(x,y)
  }

  stream = (s)->
    # This ordering makes no sense but whatever
    # https://stackoverflow.com/questions/27557724/what-is-the-proper-way-to-use-d3s-projection-stream
    trans.stream(projection.stream(s))

  # Make it work in canvas
  {inCanvas, context} = useContext(MapCanvasContext)
  if inCanvas
    if context?
      proj = geoPath({stream}, context)
      proj feature
    return null

  # Combined projection
  proj = geoPath({stream})
  d = proj feature

  h 'path', {d, rest...}

PlatePolygon = (props)->
  # An arbitrary feature tied to a plate
  {feature, rest...} = props
  {id, properties} = feature
  {old_lim, young_lim} = properties
  h PlateFeature, {feature, oldLim: old_lim, youngLim: young_lim, plateId: id, rest...}

PlatePolygons = (props)->
  {model} = useContext(RotationsContext)
  {inCanvas, clearCanvas} = useContext(MapCanvasContext)

  h APIResultView, {
    route: "/plates",
    params: {model},
    placeholder: null
  }, (data)=>
    return null unless data?

    style = {
      fill: 'rgba(200,200,200, 0.3)'
      stroke: 'rgba(200,200,200, 0.8)'
      strokeWidth: 1
    }

    h FeatureLayer, {
      useCanvas: true,
      className: 'plates',
      style
    }, data.map (feature, i)->
      h PlatePolygon, {key: i, feature}

PlateFeatureDataset = (props)->
  {name} = props
  {model} = useContext(RotationsContext)
  h APIResultView, {
    route: "/feature/#{name}",
    params: {model},
    placeholder: null
  }, (data)=>
    return null unless data?

    style = {
      fill: '#E9FCEA'
      stroke: chroma('#E9FCEA').darken().hex()
      strokeWidth: 1
    }

    h FeatureLayer, {className: name, useCanvas: true, style}, data.map (feature, i)->
      {id, properties} = feature
      {plate_id, old_lim, young_lim} = properties
      h PlateFeature, {
        key: i,
        feature,
        plateId: plate_id,
        oldLim: old_lim,
        youngLim: young_lim
      }

class WorldMapInner extends Component
  @contextType: RotationsContext
  render: ->
    {width, height, margin, marginRight, keepNorthUp, projection, children} = @props
    {model} = @context
    h Globe, {
      keepNorthUp: keepNorthUp
      projection: projection.func,
      width
      height
      scale: max([width,height])/2-20
    }, children


class WorldMap extends Component
  @contextType: MapSettingsContext
  constructor: ->
    super arguments...
    @state = {
      width: 1100,
      height: 800
    }

  onResize: (entries)=>
    {width, height} = entries[0].contentRect
    @setState {width, height}

  render: ->
    {width, height} = @state
    {featureDataset} = @props
    {keepNorthUp, projection} = @context
    h ResizeSensor, {onResize: @onResize}, (
      h 'div.world-map', null, (
        h WorldMapInner, {width, height, margin: 10, keepNorthUp, projection}, [
          h PlatePolygons
          h.if(featureDataset?) PlateFeatureDataset, {name: featureDataset}
        ]
      )
    )

export {WorldMap}

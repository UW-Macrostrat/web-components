import React, {Component, createContext, useContext, createRef, createElement} from 'react'
import {findDOMNode} from 'react-dom'
import {StatefulComponent} from '@macrostrat/ui-components'
import T from 'prop-types'
import h from './hyper'
import {MapContext} from './context'
import {DraggableOverlay} from './drag-interaction'
import {min, max} from 'd3-array'
import {geoStereographic, geoOrthographic, geoGraticule, geoPath} from 'd3-geo'
import styles from './module.styl'

GeoPath = (props)->
  {geometry, rest...} = props
  d = null
  if geometry?
    {renderPath} = useContext(MapContext)
    d = renderPath geometry
  h 'path', {d, rest...}

class Background extends Component
  @contextType: MapContext
  render: ->
    h GeoPath, {
      geometry: {type: 'Sphere'},
      className: 'background',
      @props...
    }

Graticule = (props)->
  graticule = geoGraticule()
    .step [10,10]
    .extent [
        [-180,-80]
        [180,80 + 1e-6]
      ]
  h GeoPath, {
    className: 'graticule',
    geometry: graticule(),
    props...
  }

class Globe extends StatefulComponent
  @propTypes: {
    projection: T.func.isRequired,
    width: T.number.isRequired,
    height: T.number.isRequired,
    keepNorthUp: T.bool,
    allowDragging: T.bool
    setupProjection: T.func
    scale: T.number
    translate: T.arrayOf(T.number)
  }
  @defaultProps: {
    keepNorthUp: false
    allowDragging: true
    projection: geoOrthographic()
      .clipAngle(90)
      .precision(0.5)
    setupProjection: (projection, {width, height, scale, translate})->
      if not scale?
        maxSize = min [width, height]
        scale = maxSize/2
      translate ?= [width/2, height/2]
      projection.scale(scale)
        .translate(translate)
  }

  constructor: (props)->
    super(props)

    @mapElement = createRef()

    {projection} = @props
    projection.center([0,0])

    @state = {
      projection
      zoom: 1
      canvasContexts: new Set([])
    }

  componentDidUpdate: (prevProps)=>
    {width, height, scale, translate, setupProjection} = @props
    sameDimensions = prevProps.width == width and prevProps.height == height
    sameProjection = prevProps.projection == @props.projection
    sameScale = prevProps.scale == scale and prevProps.translate == translate
    return if sameDimensions and sameProjection and sameScale
    if sameProjection
      {projection} = @state
    else
      {projection} = @props

    newProj = setupProjection(projection, {width,height, scale, translate})

    @updateProjection newProj

  updateProjection: (newProj)=>
    @updateState {projection: {$set: newProj}}

  dispatchEvent: (evt)=>
    v = findDOMNode(@)
    el = v.getElementsByClassName(styles.map)[0]
    # Simulate an event directly on the map's DOM element
    {clientX, clientY} = evt

    e1 = new Event "mousedown", {clientX, clientY}
    e2 = new Event "mouseup", {clientX, clientY}

    el.dispatchEvent(e1)
    el.dispatchEvent(e2)

  componentDidMount: =>
    @componentDidUpdate.call(@,arguments)

  render: ->
    {width, height, children, keepNorthUp, allowDragging, projection, rest...} = @props
    initialScale = projection.scale() or 500

    {projection} = @state
    actions = do => {
      updateState,
      updateProjection,
      dispatchEvent
      } = @
    renderPath = geoPath(projection)
    value = {projection, renderPath, width, height, actions...}

    xmlns = "http://www.w3.org/2000/svg"
    viewBox = "0 0 #{width} #{height}"

    h MapContext.Provider, {value}, [
      createElement 'svg', {className: 'globe', xmlns, width, height, viewBox, rest...}, [
        h 'g.map', {ref: @mapElement}, [
          h Background, {fill: 'dodgerblue'}
          h Graticule
          children
        ]
        h.if(allowDragging) DraggableOverlay, {keepNorthUp, initialScale}
      ]
    ]


export {Globe, MapContext}

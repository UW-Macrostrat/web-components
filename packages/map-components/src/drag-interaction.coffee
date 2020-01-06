import {Component, createContext, useContext} from 'react'
import {findDOMNode} from 'react-dom'
import T from 'prop-types'
import h from './hyper'
import {MapContext} from './context'
import {drag} from 'd3-drag'
import {zoom} from 'd3-zoom'
import {select, event as currentEvent, mouse} from 'd3-selection'
import {sph2cart, quat2euler, euler2quat, quatMultiply, quaternion} from './math'

class DraggableOverlay extends Component
  @contextType: MapContext
  @propTypes: {
    showMousePosition: T.bool
    keepNorthUp: T.bool
    enableZoom: T.bool
    initialScale: T.number
    dragSensitivity: T.number
  }
  @defaultProps: {
    showMousePosition: false
    enableZoom: true
    pinNorthUp: false
    dragSensitivity: 1
  }
  constructor: ->
    super arguments...
    @state = {mousePosition: null}
    @zoom = null
  render: ->
    # https://medium.com/dev-shack/clicking-and-dragging-svg-with-react-and-d3-js-5639cd0c3c3b
    {width, height, renderPath} = @context
    {showMousePosition} = @props
    {mousePosition} = @state
    h 'g.drag-overlay', [
      h 'rect.drag-mouse-target', {width, height}
      h.if(mousePosition? and showMousePosition) 'path.mouse-position', {
        d: renderPath(mousePosition)
      }
    ]

  dragStarted: (mousePos)=>
    {projection} = @context
    pos = projection.invert(mousePos)
    @setState {mousePosition: {type: "Point", coordinates: pos}}
    @r0 = projection.rotate()
    @p0 = sph2cart(pos)
    @qa = euler2quat(@r0)
    @q0 = euler2quat(@r0)

  dragged: (mousePos, evt)=>
    {keepNorthUp, dragSensitivity: sens} = @props
    {projection, rotateProjection} = @context
    rot = projection.rotate()
    @q0 = euler2quat(rot)
    pos = projection.invert(mousePos)
    q1 = quaternion(@p0, sph2cart(pos))
    res = quatMultiply( @q0, q1 )
    r1 = quat2euler(res)
    # keeping north up basically doesn't workq
    if keepNorthUp
      # A completely different rotation strategy
      r1 = [evt.x*sens, -evt.y*sens, rot[2]]
    return unless r1?
    rotateProjection(r1)

  dragEnded: =>
    @setState {mousePosition: null}

  zoomed: =>
    scale = currentEvent.transform.k
    {projection, updateProjection} = @context
    updateProjection(projection.scale(scale))

  element: =>
    select(findDOMNode(@).parentElement)

  componentDidMount: ->
    {width, height, projection, dispatchEvent} = @context
    {dragSensitivity: sens} = @props

    forwardMousePos = (func)-> ->
      func(mouse(@), currentEvent)

    eventSubject = (d)->
      # for d3 events to report x and y in terms of rotation
      r = projection.rotate()
      return {
        x: r[0] / sens
        y: -r[1] / sens
      }

    el = @element()
    @drag = drag()
      .clickDistance 2
      .subject eventSubject
      .on "start", forwardMousePos(@dragStarted)
      .on "drag", forwardMousePos(@dragged)
      .on "end", @dragEnded
    @drag(el)
    el.on 'click', ->
      console.log("Clicking")
      dispatchEvent currentEvent
      return false

    if @props.enableZoom
      @setupZoom()

  setupZoom: ->
    el = @element()
    # Zoom over one order of magnitude by default

    @zoom = zoom().on("zoom", @zoomed)
    @zoom(el)
    @updateZoom()

  updateZoom: (scale)=>
    el = @element()
    scale ?= @props.initialScale
    @zoom.scaleExtent(@getScaleExtent())
        .scaleTo(el, scale)

  getScaleExtent: =>
    {initialScale, scaleExtent} = @props
    if scaleExtent?
      return scaleExtent
    [initialScale*0.8, initialScale*2]

  componentDidUpdate: (prevProps)->
    el = @element()
    {initialScale} = @props
    return if initialScale == prevProps.initialScale
    @updateZoom() if @zoom?

export {DraggableOverlay}

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
  }
  @defaultProps: {
    showMousePosition: true
    enableZoom: true
    pinNorthUp: false
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
    @qa = euler2quat(projection.rotate())
    @q0 = euler2quat(projection.rotate())

  dragged: (mousePos)=>
    {keepNorthUp} = @props
    {projection, updateProjection} = @context
    @q0 = euler2quat(projection.rotate())
    pos = projection.invert(mousePos)
    q1 = quaternion(@p0, sph2cart(pos))
    res = quatMultiply( @q0, q1 )
    r1 = quat2euler(res)
    return unless r1?
    # keeping north up basically doesn't workq
    if keepNorthUp
      #console.log(@r0)
      r1 = [r1[0], r1[1], r1[2]]
    updateProjection(projection.rotate(r1))

  dragEnded: =>
    @setState {mousePosition: null}

  zoomed: =>
    scale = currentEvent.transform.k
    console.log scale
    {projection, updateProjection} = @context
    updateProjection(projection.scale(scale))

  componentDidMount: ->
    {width, height, projection, dispatchEvent} = @context
    forwardMousePos = (func)-> ->
      func(mouse(@))

    el = select(findDOMNode(@))
    @drag = drag()
      .clickDistance 2
      .on "start", forwardMousePos(@dragStarted)
      .on "drag", forwardMousePos(@dragged)
      .on "end", @dragEnded
    @drag(el)
    el.on 'click', ->
      dispatchEvent currentEvent

    if @props.enableZoom
      @setupZoom()

  setupZoom: ->
    el = select(findDOMNode(@))
    # Zoom over one order of magnitude by default

    @zoom = zoom().on("zoom", @zoomed)
    @zoom(el)
    @updateZoom()

  updateZoom: (scale)=>
    el = select(findDOMNode(@))
    scale ?= @props.initialScale
    @zoom.scaleExtent(@getScaleExtent())
        .scaleTo(el, scale)

  getScaleExtent: =>
    {initialScale, scaleExtent} = @props
    if scaleExtent?
      return scaleExtent
    [initialScale*0.8, initialScale*2]

  componentDidUpdate: (prevProps)->
    el = select(findDOMNode(@))
    {initialScale} = @props
    return if initialScale == prevProps.initialScale
    @updateZoom() if @zoom?

export {DraggableOverlay}

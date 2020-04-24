/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, createContext, useContext } from 'react'
import { findDOMNode } from 'react-dom'
import T from 'prop-types'
import h from './hyper'
import { MapContext } from './context'
import { drag } from 'd3-drag'
import { zoom } from 'd3-zoom'
import { select, event as currentEvent, mouse } from 'd3-selection'
import { sph2cart, quat2euler, euler2quat, quatMultiply, quaternion } from './math'

class DraggableOverlay extends Component {
  static initClass() {
    this.contextType = MapContext
    this.propTypes = {
      showMousePosition: T.bool,
      keepNorthUp: T.bool,
      enableZoom: T.bool,
      initialScale: T.number,
      dragSensitivity: T.number
    }
    this.defaultProps = {
      showMousePosition: false,
      enableZoom: true,
      pinNorthUp: false,
      dragSensitivity: 1
    }
  }
  constructor(props) {
    super(props)
    this.dragStarted = this.dragStarted.bind(this)
    this.dragged = this.dragged.bind(this)
    this.dragEnded = this.dragEnded.bind(this)
    this.zoomed = this.zoomed.bind(this)
    this.element = this.element.bind(this)
    this.updateZoom = this.updateZoom.bind(this)
    this.getScaleExtent = this.getScaleExtent.bind(this)
    this.state = { mousePosition: null }
    this.zoom = null
  }
  render() {
    // https://medium.com/dev-shack/clicking-and-dragging-svg-with-react-and-d3-js-5639cd0c3c3b
    const { width, height, renderPath } = this.context
    const { showMousePosition } = this.props
    const { mousePosition } = this.state
    return h('g.drag-overlay', [
      h('rect.drag-mouse-target', { width, height }),
      h.if(mousePosition != null && showMousePosition)('path.mouse-position', {
        d: renderPath(mousePosition)
      })
    ])
  }

  dragStarted(mousePos) {
    const { projection } = this.context
    const pos = projection.invert(mousePos)
    this.setState({ mousePosition: { type: 'Point', coordinates: pos } })
    this.r0 = projection.rotate()
    this.p0 = sph2cart(pos)
    this.qa = euler2quat(this.r0)
    return (this.q0 = euler2quat(this.r0))
  }

  dragged(mousePos, evt) {
    const { keepNorthUp, dragSensitivity: sens } = this.props
    const { projection, rotateProjection } = this.context
    const rot = projection.rotate()
    this.q0 = euler2quat(rot)
    const pos = projection.invert(mousePos)
    const q1 = quaternion(this.p0, sph2cart(pos))
    const res = quatMultiply(this.q0, q1)
    let r1 = quat2euler(res)
    // keeping north up basically doesn't workq
    if (keepNorthUp) {
      // A completely different rotation strategy
      r1 = [evt.x * sens, -evt.y * sens, rot[2]]
    }
    if (r1 == null) {
      return
    }
    return rotateProjection(r1)
  }

  dragEnded() {
    return this.setState({ mousePosition: null })
  }

  zoomed() {
    const scale = currentEvent.transform.k
    const { projection, updateProjection } = this.context
    return updateProjection(projection.scale(scale))
  }

  element() {
    // This is a hack but it seems to work!
    return select(findDOMNode(this).parentElement)
  }

  componentDidMount() {
    const { width, height, projection, dispatchEvent } = this.context
    const { dragSensitivity: sens } = this.props

    const forwardMousePos = func =>
      function() {
        return func(mouse(this), currentEvent)
      }

    const eventSubject = function(d) {
      // for d3 events to report x and y in terms of rotation
      const r = projection.rotate()
      return {
        x: r[0] / sens,
        y: -r[1] / sens
      }
    }

    const el = this.element()
    this.drag = drag()
      .clickDistance(2)
      .subject(eventSubject)
      .on('start', forwardMousePos(this.dragStarted))
      .on('drag', forwardMousePos(this.dragged))
      .on('end', this.dragEnded)
    this.drag(el)
    el.on('click', function() {
      console.log('Clicking')
      dispatchEvent(currentEvent)
      return false
    })

    if (this.props.enableZoom) {
      return this.setupZoom()
    }
  }

  setupZoom() {
    const el = this.element()
    // Zoom over one order of magnitude by default

    this.zoom = zoom().on('zoom', this.zoomed)
    this.zoom(el)
    return this.updateZoom()
  }

  updateZoom(scale) {
    const el = this.element()
    if (scale == null) {
      scale = this.props.initialScale
    }
    return this.zoom.scaleExtent(this.getScaleExtent()).scaleTo(el, scale)
  }

  getScaleExtent() {
    const { initialScale, scaleExtent } = this.props
    if (scaleExtent != null) {
      return scaleExtent
    }
    return [initialScale * 0.8, initialScale * 2]
  }

  componentDidUpdate(prevProps) {
    const el = this.element()
    const { initialScale } = this.props
    if (initialScale === prevProps.initialScale) {
      return
    }
    if (this.zoom != null) {
      return this.updateZoom()
    }
  }
}
DraggableOverlay.initClass()

export { DraggableOverlay }

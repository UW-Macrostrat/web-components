/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, createContext, useContext, createRef, createElement } from 'react'
import { findDOMNode } from 'react-dom'
import T from 'prop-types'
import h from './hyper'
import { MapContext } from './context'
import { geoPath } from 'd3-geo'
import { memoize } from 'underscore'

// https://philna.sh/blog/2018/09/27/techniques-for-animating-on-the-canvas-in-react/

const MapCanvasContext = createContext({
  context: null,
  inCanvas: false,
  renderPath: null
})

class CanvasLayer extends Component {
  static initClass() {
    this.contextType = MapContext
  }
  constructor() {
    {
      // Hack: trick Babel/TypeScript into allowing this before super.
      if (false) {
        super()
      }
      let thisFn = (() => {
        return this
      }).toString()
      let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1]
      eval(`${thisName} = this;`)
    }
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
    super(...arguments)
    this.canvas = createRef()
    this.state = {
      // The canvas rendering context
      context: null,
      isLoaded: false
    }
  }

  render() {
    // https://medium.com/dev-shack/clicking-and-dragging-svg-with-react-and-d3-js-5639cd0c3c3b
    const { width, height } = this.context
    let { children, style } = this.props
    const { isLoaded } = this.state

    let context = null
    const { current: el } = this.canvas
    if (el != null) {
      context = el.getContext('2d')
    }

    const value = {
      context,
      inCanvas: true,
      renderPath: null
    }

    const dpr = window.devicePixelRatio || 1
    if (context != null) {
      value.renderPath = geoPath(this.context.projection, context)

      if (style == null) {
        style = {}
      }
      let { fill, stroke, strokeWidth } = style
      if (fill == null) {
        fill = 'rgba(200,200,200,0.5)'
      }
      if (stroke == null) {
        stroke = '#444'
      }
      context.lineWidth = strokeWidth || 1
      context.strokeStyle = stroke
      context.fillStyle = fill
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      context.lineJoin = 'round'
      context.lineCap = 'round'
    }
    style = { width, height, pointerEvents: 'none' }

    // hack for safari to display div
    const xmlns = 'http://www.w3.org/1999/xhtml'
    return h(
      MapCanvasContext.Provider,
      { value },
      createElement('foreignObject', { width, height }, [
        createElement('canvas', {
          xmlns,
          width: width * dpr,
          height: height * dpr,
          style,
          ref: this.canvas
        }),
        children
      ])
    )
  }

  componentWillUpdate() {
    const { height, width } = this.context
    const { current: el } = this.canvas
    if (el == null) {
      return
    }
    const ctx = el.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    return ctx.beginPath()
  }

  componentDidMount() {
    this.componentDidUpdate()
    // Hack to force initial redraw
    return this.setState({ isLoaded: true })
  }

  componentDidUpdate() {
    const { current: el } = this.canvas
    if (el == null) {
      return
    }
    const context = el.getContext('2d')
    context.fill()
    return context.stroke()
  }
}
CanvasLayer.initClass()

export { CanvasLayer, MapCanvasContext }

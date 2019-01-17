
# https://pomax.github.io/bezierjs/
# http://jsfiddle.net/halfsoft/Gsz2a/

import {Component} from 'react'
import {findDOMNode} from 'react-dom'
import h from 'react-hyperscript'
import {SVGComponent, SectionNavigationControl} from '../util'
import Bezier from 'bezier-js'
import {path} from 'd3-path'
import {DrawFunctions} from './bezier-draw'
import {handleInteraction} from './interaction'

class BezierComponent extends Component
  render: ->
    h 'path.bezier'
  componentDidMount: ->
    curve = new Bezier(100,25 , 10,90 , 110,100 , 150,195)
    el = findDOMNode @
    el.setAttribute("fill", "none")
    el.setAttribute("stroke", "black")
    el.setAttribute("d", curve.toSVG())

class CanvasBezierComponent extends Component
  render: ->
    size = {width: 300, height: 500}
    h 'canvas', {size..., style: size}
  componentDidMount: ->
    curve = new Bezier(100,25 , 10,90 , 110,100 , 150,195)
    el = findDOMNode @
    draw = DrawFunctions(el)
    drawCurve = ->
      draw.drawSkeleton(curve)
      draw.drawCurve(curve)

    drawCurve()
    handleInteraction(el,curve).onupdate = (evt)->
      draw.reset(curve, evt)
      draw.drawSkeleton(curve)
      draw.drawCurve(curve)



class RegionalCrossSectionPage extends Component
  render: ->
    h 'div', [
      h SectionNavigationControl
      h 'div.regional-cross-section', [
        h SVGComponent, {
          className: 'cross-section-test',
          width: 300,
          height: 500}, [
          h 'rect', {height: 50, width: 50, x: 10, y: 10, fill: 'red'}
          h BezierComponent
        ]
        h CanvasBezierComponent
      ]
    ]

export {RegionalCrossSectionPage}


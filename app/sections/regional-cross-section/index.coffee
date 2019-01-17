
# https://pomax.github.io/bezierjs/
# http://jsfiddle.net/halfsoft/Gsz2a/

import {Component} from 'react'
import {findDOMNode} from 'react-dom'
import h from 'react-hyperscript'
import {SVGComponent, SectionNavigationControl} from '../util'
import Bezier from 'bezier-js'
import {path} from 'd3-path'

class BezierComponent extends Component
  render: ->
    h 'path.bezier'
  componentDidMount: ->
    curve = new Bezier(100,25 , 10,90 , 110,100 , 150,195)
    el = findDOMNode @
    el.setAttribute("d", curve.toSVG())

  drawLine: (p1, p2, offset)->
    offset = offset or { x:0, y:0 }
    ox = offset.x
    oy = offset.y
    ctx.beginPath()
    ctx.moveTo(p1.x + ox,p1.y + oy)
    ctx.lineTo(p2.x + ox,p2.y + oy)
    ctx.stroke()

  drawSkeleton: (curve, offset, nocoords)->
    offset = offset or { x:0, y:0 }
    pts = curve.points
    this.drawLine(pts[0], pts[1], offset)
    if pts.length == 3
      this.drawLine(pts[1], pts[2], offset)
    else
      this.drawLine(pts[2], pts[3], offset)
    ctx.strokeStyle = "black"
    if not nocoords then this.drawPoints(pts, offset)

class RegionalCrossSectionPage extends Component
  render: ->
    h 'div', [
      h SectionNavigationControl
      h 'div.regional-cross-section', [
        h SVGComponent, {className: 'cross-section-test'}, [
          h 'rect', {height: 50, width: 50, x: 10, y: 10, fill: 'red'}
          h BezierComponent
        ]
      ]
    ]

export {RegionalCrossSectionPage}


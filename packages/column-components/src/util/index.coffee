import h from 'react-hyperscript'
import {createElement, useContext, forwardRef, createRef} from 'react'
import {expandInnerSize, extractPadding, removePadding, extractMargin, removeMargin} from './box-model'
import {ColumnContext} from '../context'
import Box from 'ui-box'
import classNames from 'classnames'

SVGNamespaces = {
  xmlns: "http://www.w3.org/2000/svg"
  xmlnsXlink: "http://www.w3.org/1999/xlink"
}

SVG = forwardRef (props, ref)->
  {innerRef, children, style, rest...} = expandInnerSize(props)
  if innerRef?
    ref = innerRef

  # Sizing
  {paddingLeft, paddingTop} = extractPadding(props)
  margin = extractMargin(props)
  realRest = removeMargin(removePadding(rest))

  h 'svg', {
    ref
    style: {style..., margin...}
    realRest...
    SVGNamespaces...
  }, (
    h 'g', {
      transform: "translate(#{paddingLeft},#{paddingTop})"
    }, children
  )

ForeignObject = (props)->
  createElement 'foreignObject', props

ColumnSVG = (props)->
  ## Need to rework to use UI Box code
  {children, className, innerRef, rest...} = props
  {pixelHeight} = useContext(ColumnContext)
  nextProps = expandInnerSize({innerHeight: pixelHeight, rest...})
  {paddingLeft, paddingTop, innerHeight, innerWidth, height, width} = nextProps
  h SVG, {
    className: classNames(className, 'section')
    height
    width
    innerRef
  }, (
    h 'g.backdrop', {
      transform: "translate(#{paddingLeft},#{paddingTop})"
    }, children
  )

export {
  SVGNamespaces
  SVG
  ColumnSVG
  ForeignObject
}

export * from './column-box'
export * from './box-model'
export * from './scroll-box'

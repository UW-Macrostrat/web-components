import h from 'react-hyperscript'
import {createElement, useContext, forwardRef, createRef} from 'react'
import {expandInnerSize} from './box-model'
import {ColumnContext} from '../context'
import Box from 'ui-box'
import classNames from 'classnames'

SVGNamespaces = {
  xmlns: "http://www.w3.org/2000/svg"
  xmlnsXlink: "http://www.w3.org/1999/xlink"
}

SVG = forwardRef (props, ref)->
  {innerRef, rest...} = props
  if innerRef?
    ref = innerRef

  h 'svg', {
    ref
    rest...
    SVGNamespaces...
  }

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

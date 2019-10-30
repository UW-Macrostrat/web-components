import h from 'react-hyperscript'
import {createElement, useContext} from 'react'
import {expandInnerSize} from './box-model'
import {ColumnContext} from '../context'
import Box from 'ui-box'

SVGNamespaces = {
  xmlns: "http://www.w3.org/2000/svg"
  xmlnsXlink: "http://www.w3.org/1999/xlink"
}

SVG = (props)-> h Box, {
  is: 'svg'
  props...
  SVGNamespaces...
}

ForeignObject = (props)->
  createElement 'foreignObject', props

ColumnSVG = (props)->
  ## Need to rework to use UI Box code
  {children, rest...} = props
  {pixelHeight} = useContext(ColumnContext)
  nextProps = expandInnerSize({innerHeight: pixelHeight, rest...})
  {paddingLeft, paddingTop} = nextProps
  h SVG, {
    className: 'section'
    nextProps...
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

export * from './box-model'

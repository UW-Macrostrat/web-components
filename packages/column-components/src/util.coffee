import h from 'react-hyperscript'
import {createElement} from 'react'

SVGNamespaces = {
  xmlns: "http://www.w3.org/2000/svg"
  xmlnsXlink: "http://www.w3.org/1999/xlink"
}

SVG = (props)-> h 'svg', {props..., SVGNamespaces...}

ForeignObject = (props)->
  createElement 'foreignObject', props

export {
  SVGNamespaces
  SVG
  ForeignObject
}

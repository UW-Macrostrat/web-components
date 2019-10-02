import {findDOMNode} from "react-dom"
import * as d3 from "d3"
import "d3-selection-multi"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import {db, storedProcedure, query} from "app/sections/db"
import {Node, Renderer, Force} from "labella"
import {calculateSize} from "calculate-size"
import FlexibleNode from "./flexible-node"
import T from "prop-types"
import {EditableText} from "@blueprintjs/core"
import {PhotoOverlay} from "./photo-overlay"
import {ColumnContext} from '../context'

arrowMarker = (id, orient, sz=2.5)->
  h 'marker', {
    id
    orient
    markerHeight: sz
    markerWidth: sz
    markerUnits: 'strokeWidth'
    refX:"0"
    refY:"0"
    viewBox:"-#{sz} -#{sz} #{sz*2} #{sz*2}"
  }, [
    h 'path', {
      d:"M 0,0 m -#{sz},-#{sz} L #{sz},0 L -#{sz},#{sz} Z"
      fill:"#000000"
    }
  ]


NoteDefs = ->
  h 'defs', [
    arrowMarker 'arrow_start', 270
    arrowMarker 'arrow_end', 90
  ]

export default NoteDefs

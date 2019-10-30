import T from 'prop-types'
import {hyperStyled} from "@macrostrat/hyper"
import styles from "./main.styl"
import {format} from 'd3-format'
import {IntervalShape} from './types'

h = hyperStyled(styles)

LabeledControl = (props)->
  {title, children, rest...} = props
  delete rest.is
  h 'label.bp3-label', null, [
    h.if(title?) 'span.label-text', null, title
    if props.is? then h(props.is, rest) else null
  ]

IntervalEditorTitle = (props)->
  {showID, title, interval, heightFormat} = props
  {id, top, bottom} = interval
  fmt = (v)->v
  if heightFormat?
    fmt = format(heightFormat)
  showID ?= true
  h "div.editor-dialog-title", [
    h "span.title-center", title
    h "span.height-range", "#{fmt(bottom)} – #{fmt(top)} m"
    h.if(id? and showID) "code", id
  ]

IntervalEditorTitle.propTypes = {
  showID: T.bool
  title: T.node.isRequired
  interval: IntervalShape.isRequired
  heightFormat: T.string
}

export {LabeledControl, IntervalEditorTitle}

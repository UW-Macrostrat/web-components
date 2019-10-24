import h from "~/hyper"
import {Button} from '@blueprintjs/core'

PanelHeader = (props)->
  {title, onClose, children} = props
  h 'div.panel-header', [
    h.if(title?) 'h1.title', null, title
    h.if(children?) [
      h 'div.expander'
      children
    ]
    h 'div.expander'
    h Button, {minimal: true, icon: "cross", onClick: onClose}
  ]

Panel = (props)->
  {children, className, style, rest...} = props
  h 'div.panel-column', [
    h 'div.panel-container', [
      h 'div.panel-container-inner', [
        h 'div.panel-outer', [
          h 'div.panel', {className, style}, [
            h PanelHeader, rest
            h 'div.panel-content', null, children
          ]
          h 'div.expander'
        ]
      ]
    ]
  ]

export {Panel, PanelHeader}

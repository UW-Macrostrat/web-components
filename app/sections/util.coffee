import {Component} from "react"
import h from "react-hyperscript"
import {NavLink, BackLink} from "../nav"
import {Icon} from "react-fa"

class SectionNavigationControl extends Component
  render: ->
    settings = null
    if @props.toggleSettings
      settings = h 'li', [
        h 'a', onClick: @props.toggleSettings, [
          h Icon, name: 'gear', size: '2x'
        ]
      ]

    {children} = @props

    h 'ul.controls', [
      h BackLink
      h NavLink, to: '/', [h Icon, name: 'home', size: '2x']
      settings
      children
    ]

class KnownSizeComponent extends Component
  constructor: (props)->
    super(props)
    Object.defineProperty(@,'width', {get: @__width})
    Object.defineProperty(@,'height', {get: @__height})

  @__width: ->
    return null
  @__height: ->
    return null

SVGNamespaces = {
  xmlns: "http://www.w3.org/2000/svg"
  xmlnsXlink: "http://www.w3.org/1999/xlink"
}

export {
  SectionNavigationControl
  SVGNamespaces
  KnownSizeComponent
}

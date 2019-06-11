import {Component, createContext} from "react"
import h from "react-hyperscript"
import {Icon} from "react-fa"
import {SectionNavigationControl} from "../util"
import * as d3 from "d3"
import classNames from "classnames"
import {SwatchesPicker} from "react-color"
import {Popover} from "@blueprintjs/core"
import {FaciesContext} from './context'

class FaciesSwatch extends Component
  @defaultProps: {
    isEditable: true
    facies: null
  }
  render: =>
    {facies: d} = @props
    basicSwatch = h 'div.color-swatch', {style: {
      backgroundColor: d.color or 'black'
      width: '2em'
      height: '2em'
    }}
    return basicSwatch unless @props.isEditable
    h Popover, {
      tetherOptions:{
        constraints: [{ attachment: "together", to: "scrollParent" }]
      }
    }, [
      basicSwatch
      h 'div', [
        h FaciesContext.Consumer, {}, ({setFaciesColor})=>
          h SwatchesPicker, {
            color: d.color or 'black'
            onChangeComplete: (color)->
              setFaciesColor(d.id, color.hex)
            styles: {
              width: 500
              height: 570
            }
          }
      ]
    ]

class FaciesDescriptionPage extends Component
  defaultProps: {
    isEditable: false
  }
  constructor: (props)->
    super props
    @state = {
      options: {
        isEditable: false
      }
    }

  render: ->
    __html = ""
    dangerouslySetInnerHTML = {__html}
    h 'div.page.facies-descriptions.text-page', [
      h SectionNavigationControl
      h 'div.facies-descriptions', {
        dangerouslySetInnerHTML
      }
   ]

class FaciesDescriptionSmall extends Component
  @defaultProps: {selected: null, isEditable: false}
  render: ->
    h FaciesContext.Consumer, {}, ({facies})=>
      h 'div.facies-description-small', [
        h 'h5', 'Facies'
        h 'div', facies.map (d)=>
          onClick = null
          style = {}
          if @props.onClick?
            onClick = =>@props.onClick(d)
            style.cursor = 'pointer'
          {selected} = @props
          if selected == d.id
            style.backgroundColor = d.color
            style.color = 'white'
          className = classNames({selected: selected == d.id})

          h 'div.facies.pt-card.pt-elevation-0', {
            key: d.id, onClick, style, className
          }, @renderFacies(d)
      ]

  renderFaciesSwatch: (d)=>
    basicSwatch = h 'div.color-swatch', {style: {
      backgroundColor: d.color or 'black'
      width: '2em'
      height: '2em'
    }}
    return basicSwatch unless @props.isEditable
    h Popover, {
      tetherOptions:{
        constraints: [{ attachment: "together", to: "scrollParent" }]
      }
    }, [
      basicSwatch
      h 'div', [
        h FaciesContext.Consumer, {}, ({setFaciesColor})=>
          h SwatchesPicker, {
            color: d.color or 'black'
            onChangeComplete: (color)->
              setFaciesColor(d.id, color.hex)
            styles: {
              width: 500
              height: 570
            }
          }
      ]
    ]

  renderFacies: (d)=>
    h 'div.header', [
      h 'p.name', {style: {marginRight: 20, textAlign: 'left'}}, d.name
      h FaciesSwatch, {facies: d}
    ]

export {FaciesDescriptionPage, FaciesDescriptionSmall, FaciesContext, FaciesSwatch}

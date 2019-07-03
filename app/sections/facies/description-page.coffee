import {Component} from "react"
import h from "react-hyperscript"
import T from 'prop-types'
import {SectionNavigationControl} from "../util"
import classNames from "classnames"
import {FaciesContext} from './context'
import {FaciesSwatch} from './color-picker'

class FaciesDescriptionPage extends Component
  @defaultProps: {
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

FaciesCard = ({facies})->
  h 'div.header', [
    h 'p.name', {style: {marginRight: 20, textAlign: 'left'}}, facies.name
    h FaciesSwatch, {facies}
  ]

class FaciesDescriptionSmall extends Component
  @contextType: FaciesContext
  @defaultProps: {selected: null, isEditable: false}
  renderEach: (d)=>
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

    h 'div.facies.bp3-card.bp3-elevation-0', {
      key: d.id, onClick, style, className
    }, h(FaciesCard, {facies: d})

  render: ->
    {facies} = @context
    h 'div.facies-description-small', [
      h 'h5', 'Facies'
      h 'div', facies.map @renderEach
    ]

export {FaciesDescriptionPage, FaciesDescriptionSmall, FaciesCard}

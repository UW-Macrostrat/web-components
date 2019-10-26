import {findDOMNode} from "react-dom"
import {format} from "d3-format"
import {Component, createElement, useContext} from "react"
import h from "./hyper"
import {Popover, Position} from "@blueprintjs/core"
import {withRouter} from "react-router-dom"
import {ColumnLayoutContext} from './context'
import T from 'prop-types'
import chroma from 'chroma-js'

fmt = format('.1f')
fmt2 = format('.2f')

IntervalNotification = (props)->
  {id, height, bottom, top, surface} = props
  h 'div', [
    h 'h4', "Section #{id} @ #{fmt(height)} m"
    h 'p', [
      'Interval ID: '
      h('code', id)
    ]
    h 'p', "#{bottom} - #{top} m"
    if surface then h('p', ["Surface: ", h('code',surface)]) else null
  ]

class OverlayBox extends Component
  @contextType: ColumnLayoutContext
  render: ->
    {division, background, className, onClick} = @props
    {widthForDivision, scale} = @context

    top = scale(division.top)
    bottom = scale(division.bottom)
    height = bottom-top

    width = widthForDivision(division)

    style = {
      marginTop: top
      height
      width
      pointerEvents: 'none'
      position: 'absolute'
    }

    h 'div', {style}, [
      h 'div', {
        onClick
        className
        style: {
          cursor: if onClick? then 'pointer' else null
          width: '100%'
          height: '100%'
          background
        }
      }
      @props.children
    ]

OverlayBox.propTypes = {
  division: T.object
}

EditingBox = ({division, color})->
  return null unless division?
  color ?= "red"
  background = chroma(color).alpha(0.5).css()
  h OverlayBox, {
    className: 'editing-box'
    division
    background
  }

class DivisionEditOverlay extends Component
  @contextType: ColumnLayoutContext
  @propTypes: {
    left: T.number
    top: T.number
    showInfoBox: T.bool
    onClick: T.func
    allowEditing: T.bool
    renderEditorPopup: T.func
    scaleToGrainsize: T.bool
    editingInterval: T.object
    color: T.string
  }
  @defaultProps: {
    onEditInterval: ->
    onHoverInterval: ->
    onClick: ->
    left: 0
    top: 0
    showInfoBox: false
    allowEditing: true
    renderEditorPopup: ->return null
    color: 'red'
  }
  constructor: (props)->
    super props
    @state = {
      height: null
      hoveredDivision: null
      popoverIsOpen: false
    }

  onHoverInterval: (event)=>
    event.stopPropagation()
    # findDOMNode might be slow but I'm not sure
    return unless findDOMNode(@) == event.target
    height = @heightForEvent(event)
    @setState {height}
    return unless @props.allowEditing
    {divisions} = @context

    division = null
    for d in divisions
      if d.bottom < height < d.top
        division = d
        break
    return if division == @state.hoveredDivision
    @setState {hoveredDivision: division}

  heightForEvent: (event)=>
    {scale} = @context
    {offsetY} = event.nativeEvent
    return scale.invert(offsetY)

  onEditInterval: (event)=>
    # This could be moved to the actual interval
    # wrapped with a withRouter
    {history, showInfoBox} = @props
    {hoveredDivision} = @state
    height = @heightForEvent(event)
    event.stopPropagation()
    if event.shiftKey and showInfoBox
      @setState {popoverIsOpen: true}
      return
    @props.onClick({height, division: hoveredDivision})

  onClick: (event)=>
    # This event handler might be unnecessary
    if @props.allowEditing
      return @onEditInterval(event)
    height = @heightForEvent(event)
    @props.onClick({height})

  renderCursorLine: =>
    {height, hoveredDivision} = @state
    {scale} = @context
    return unless height?
    style = {
      top: scale(height)
      height: 0
      border: "0.5px solid black"
      width: @context.widthForDivision(hoveredDivision)
      position: 'absolute'
      pointerEvents: 'none'
    }

    h 'div.cursor', {style}, [
      h 'div.cursor-position', {style: {
        pointerEvents: 'none'
        fontWeight: 'bold'
        fontSize: '12px'
        left: '2px'
        top: '-14px'
        position: 'absolute'
        color: 'black'
      }}, [
        fmt2(height)
      ]
    ]

  renderHoveredBox: =>
    return null unless @state.hoveredDivision?
    {popoverIsOpen, hoveredDivision: division} = @state
    width = @context.widthForDivision(division)
    {color} = @props
    background = chroma(color).alpha(0.3).css()

    h OverlayBox, {
      division
      className: 'hovered-box'
      background
      onClick: @onEditInterval
    }, [
      h.if(@props.renderEditorPopup) Popover, {
        isOpen: popoverIsOpen and division?
        style: {display: 'block', width}
        position: Position.LEFT
      }, [
        h 'span'
        @props.renderEditorPopup(division)
      ]
    ]

  render: ->
    {divisions, pixelHeight, width} = @context
    {popoverIsOpen, hoveredDivision: division} = @state
    {width, left, top, color} = @props

    h 'div.edit-overlay', {
      style: {
        width
        left
        top
        height: pixelHeight
        position: 'absolute'
        zIndex: 18
        pointerEvents: 'all'
        cursor: 'pointer'
      }
      onMouseEnter: @onHoverInterval
      onMouseMove: @onHoverInterval
      onClick: @onClick
      onMouseLeave: =>@setState {
        hoveredDivision: null,
        height: null
      }
    }, [
      @renderHoveredBox()
      h EditingBox, {division: @props.editingInterval, color}
      @renderCursorLine()
    ]


export {DivisionEditOverlay}

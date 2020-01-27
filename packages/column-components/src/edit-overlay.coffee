import {findDOMNode} from "react-dom"
import {format} from "d3-format"
import {Component, createElement, useContext} from "react"
import h from "./hyper"
import {Popover, Position, Button, Intent} from "@blueprintjs/core"
import {withRouter} from "react-router-dom"
import {ColumnLayoutContext} from './context'
import T from 'prop-types'
import chroma from 'chroma-js'
import Box from 'ui-box'

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

PopoverEditorTitle = (props)->
  {interval, children} = props
  h 'div.interval-editor-title', [
    h 'h3', "#{fmt2(interval.bottom)}–#{fmt2(interval.top)} m"
    h 'div.id', [
      h 'code', interval.id
    ]
    children
  ]


class OverlayBox extends Component
  @contextType: ColumnLayoutContext
  render: ->
    {division, background, className, onClick} = @props
    {widthForDivision, scaleClamped} = @context

    top = scaleClamped(division.top)
    bottom = scaleClamped(division.bottom)
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

EditingBox = ({division, color, rest...})->
  return null unless division?
  color ?= "red"
  background = chroma(color).alpha(0.5).css()
  h OverlayBox, {
    className: 'editing-box'
    division
    background
    rest...
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
    width: T.number
    popoverWidth: T.number
    selectedHeight: T.number
  }
  @defaultProps: {
    onHoverInterval: ->
    onClick: ->
    left: 0
    top: 0
    showInfoBox: false
    allowEditing: true
    renderEditorPopup: ->return null
    color: 'red'
    popoverWidth: 340
  }
  constructor: (props)->
    super props
    @state = {
      height: null
      hoveredDivision: null
      popoverIsOpen: false
    }
    @timeout = null

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
      if d.bottom <= height < d.top
        division = d
        break
    return if division == @state.hoveredDivision
    @setState {hoveredDivision: division}
    if @timeout?
      clearTimeout(@timeout)
      @timeout = null

  removeHoverBox: =>
    @setState {hoveredDivision: null, popoverIsOpen: false}
    @timeout = null

  heightForEvent: (event)=>
    {scale} = @context
    {offsetY} = event.nativeEvent
    return scale.invert(offsetY)

  onEditInterval: (event)=>
    if @state.popoverIsOpen
      return
    # This could be moved to the actual interval
    # wrapped with a withRouter
    {history, showInfoBox} = @props
    {hoveredDivision} = @state
    height = @heightForEvent(event)
    event.stopPropagation()
    if event.shiftKey and showInfoBox
      @setState {popoverIsOpen: true}
      return
    @props.onClick({event, height, division: hoveredDivision})

  onClick: (event)=>
    # This event handler might be unnecessary
    if @props.allowEditing
      return @onEditInterval(event)
    height = @heightForEvent(event)
    @props.onClick({height})

  renderCursorLine: =>
    {height, hoveredDivision} = @state
    {scaleClamped} = @context
    # Show the height we have selected if we are not hovering
    {selectedHeight} = @props
    height ?= selectedHeight
    return unless height?
    style = {
      top: scaleClamped(height)
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
    }, [
      h.if(@props.renderEditorPopup) Popover, {
        isOpen: popoverIsOpen and division?
        style: {display: 'block', width}
        position: Position.LEFT
      }, [
        h 'div', {style: {width, height: 30, transform: "translate(0,-30)"}}
        h 'div.editor-popover-contents', {
          style: {
            width: @props.popoverWidth
            padding: '10px'
          }
        }, [
          h PopoverEditorTitle, {
            interval: division
          }, [
            h Button, {
              icon: 'cross',
              minimal: true
              intent: Intent.WARNING
              onClick: @closePopover
            }

          ]
          @props.renderEditorPopup(division)
        ]
      ]
    ]

  closePopover: =>
    @setState {
      popoverIsOpen: false
    }

  render: ->
    {divisions, pixelHeight, width} = @context
    {popoverIsOpen, hoveredDivision: division} = @state
    {left, top, color} = @props
    width ?= @props.width

    h Box, {
      className: 'edit-overlay'
      width
      height: pixelHeight
      style: {
        left
        top
        position: 'absolute'
        zIndex: 18
        pointerEvents: 'all'
        cursor: 'pointer'
      }
      onClick: @onEditInterval
      onMouseEnter: @onHoverInterval
      onMouseMove: @onHoverInterval
      onMouseLeave: =>
        return if popoverIsOpen
        @setState {height: null}
        @timeout = setTimeout(@removeHoverBox, 1000)
    }, [
      @renderHoveredBox()
      h EditingBox, {
        division: @props.editingInterval, color}
      @renderCursorLine()
    ]


export {DivisionEditOverlay}

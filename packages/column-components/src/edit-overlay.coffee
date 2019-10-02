import {findDOMNode} from "react-dom"
import {format} from "d3-format"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import {Popover, Position} from "@blueprintjs/core"
import {withRouter} from "react-router-dom"
import {ColumnContext} from './context'
import T from 'prop-types'

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

class DivisionEditOverlay extends Component
  @contextType: ColumnContext
  @propTypes: {
    width: T.number.isRequired
    left: T.number
    top: T.number
    showInfoBox: T.bool
    onClick: T.func
    allowEditing: T.bool
    renderEditorPopup: T.func
    scaleToGrainsize: T.bool
  }
  @defaultProps: {
    onEditInterval: ->
    onHoverInterval: ->
    onClick: ->
    left: 0
    top: 0
    showInfoBox: false
    allowEditing: true
    scaleToGrainsize: true
    renderEditorPopup: ->return null
  }
  constructor: (props)->
    super props
    @state = {
      height: null
      division: null
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
    return if division == @state.division
    @setState {division}

  heightForEvent: (event)=>
    {scale} = @context
    {offsetY} = event.nativeEvent
    return scale.invert(offsetY)

  onEditInterval: (event)=>
    # This could be moved to the actual interval
    # wrapped with a withRouter
    {history, showInfoBox} = @props
    {division} = @state
    height = @heightForEvent(event)
    event.stopPropagation()
    if event.shiftKey and showInfoBox
      @setState {popoverIsOpen: true}
      return
    console.log division
    @props.onClick({height, division})

  onClick: (event)=>
    # This event handler might be unnecessary
    if @props.allowEditing
      return @onEditInterval(event)
    height = @heightForEvent(event)
    @props.onClick({height})

  renderEditBoxInner: =>
    h 'div.edit-box', {
      onClick: @onEditInterval
      style: {
        width: '100%'
        height: '100%'
        backgroundColor: "rgba(255,0,0,0.5)"
        cursor: "pointer"
      }
    }

  renderCursorLine: =>
    {height} = @state
    {scale} = @context
    return unless height?
    style = {
      top: scale(height)
      height: 0
      border: "0.5px solid black"
      width: @props.width
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

  boxWidth: (division)=>
    {scaleToGrainsize, width} = @props
    if not scaleToGrainsize
      return width
    # This is kind of a silly way to do things
    # Probably should use some type of nested context
    {grainsizeScale, grainsizeForDivision} = @context
    return grainsizeScale(grainsizeForDivision(division))

  renderEditBox: =>
    {divisions, pixelHeight, width} = @context
    {popoverIsOpen, division} = @state
    {width, left, top} = @props
    isOpen = popoverIsOpen and division?

    {scale, pixelHeight, grainsizeScale} = @context
    return h('div') unless division?

    top = scale(division.top)
    bottom = scale(division.bottom)
    height = bottom-top

    width = @boxWidth(division)

    style = {
      marginTop: top
      height
      width
      pointerEvents: 'none'
    }

    h 'div.edit-box-outer', {style}, [
      @renderEditBoxInner()
      h Popover, {
        isOpen
        style: {display: 'block', width}
        position: Position.LEFT
      }, [
        h 'span'
        @props.renderEditorPopup(division)
      ]
    ]

  render: ->
    {divisions, pixelHeight, width} = @context
    {popoverIsOpen, division} = @state
    {width, left, top} = @props

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
        division: null,
        height: null
      }
    }, [
      @renderEditBox()
      @renderCursorLine()
    ]


export {DivisionEditOverlay}

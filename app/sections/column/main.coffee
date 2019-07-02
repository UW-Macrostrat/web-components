import {findDOMNode} from "react-dom"
import * as d3 from "d3"
import "d3-selection-multi"
import {Component, createElement} from "react"
import h from "react-hyperscript"
import {SectionAxis} from "./axis"
import SectionImages from "./images"
import NotesColumn from "./notes"
import "./main.styl"
import {Intent} from "@blueprintjs/core"
import {Notification} from "../../notify"
import {GrainsizeScale} from "./grainsize"
import {SymbolColumn} from "./symbol-column"
import {ModalEditor} from "./modal-editor"
import {SVGNamespaces, ColumnDivisionsProvider, KnownSizeComponent} from "../util"
import Samples from "./samples"
import {FloodingSurface, TriangleBars} from "./flooding-surface"
import {ColumnProvider, ColumnContext} from './context'
import {
  LithologyColumn,
  GeneralizedSectionColumn,
  SimplifiedLithologyColumn, CoveredOverlay, FaciesColumnInner,
  LithologyColumnInner
} from "./lithology"
import {SequenceStratConsumer} from "../sequence-strat-context"
import {DivisionEditOverlay} from './edit-overlay'
import {db, storedProcedure, query} from "../db"
import {dirname} from "path"
import update from "immutability-helper"
import T from "prop-types"

fmt = d3.format(".1f")
baseDir = dirname require.resolve '..'
sql = (id)-> storedProcedure(id, {baseDir})

class ScrollToHeightComponent extends Component
  @contextType: ColumnContext
  @propTypes: {
    scrollToHeight: T.number
    id: T.string
  }
  constructor: (props)->
    super props
    @state = {loaded: false}
  render: ->

    h 'div.section-outer', null, @props.children
  componentDidUpdate: ->
    node = findDOMNode(this)
    {scale} = @context
    {scrollToHeight, id} = @props
    {loaded} = @state
    return unless scrollToHeight?
    return if loaded
    scrollTop = scale(scrollToHeight)-window.innerHeight/2
    node.scrollTop = scrollTop

    Notification.show {
      message: "Section #{id} @ #{fmt(scrollToHeight)} m"
      intent: Intent.PRIMARY
    }
    @setState {loaded: true}

class SectionComponent extends KnownSizeComponent
  @defaultProps: {
    zoom: 1
    pixelsPerMeter: 20
    skeletal: false
    offset: 0
    offsetTop: null
    useRelativePositioning: true
    showTriangleBars: false
    visible: true
    trackVisibility: true
    innerWidth: 250
    offsetTop: null
    scrollToHeight: null
    height: 100 # Section height in meters
    lithologyWidth: 40
    logWidth: 450
    containerWidth: 1000
    showSymbols: true
    showNotes: true
    showFacies: false
    isEditable: false
    editingInterval: {id: null}
    useRelativePositioning: true
    padding: {
      left: 150
      top: 30
      right: 0
      bottom: 30
    }
  }
  @propTypes: {
    divisions: T.arrayOf(T.object)
  }

  constructor: (props)->
    super props
    @state = {
      editingInterval: {id: null, height: null}
    }

  renderSectionImages: =>
    {zoom} = @props
    skeletal = false
    return if zoom < 0.25
    h SectionImages, {
      padding: @props.padding
      lithologyWidth: @props.lithologyWidth
      imageFiles: @props.imageFiles
      extraSpace: if @zoom > 0.5 then 2.5*zoom else 0
      skeletal: skeletal or @props.activeDisplayMode != 'image'
    }

  renderInnerElements: =>
    {lithologyWidth, divisions, id, padding} = @props
    {editingInterval} = @state

    {heightOfTop} = @props
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom
    style = {top: marginTop}

    console.log editingInterval.height

    h 'div.section', {style}, [
      h ModalEditor, {
        isOpen: editingInterval.id?
        interval: divisions.find (d)-> d.id == editingInterval.id
        height: editingInterval.height
        section: id
        closeDialog: =>
          @setState {editingInterval: {id:null}}
        addInterval: @addInterval
        removeInterval: @removeInterval
        onUpdate: @onIntervalUpdated
      }
      @renderOverlaySVG()
      @renderSectionImages()
      h DivisionEditOverlay, {
        onClick: @onEditInterval
        width: lithologyWidth
        top: padding.top
        left: padding.left
        allowEditing: true
      }
    ]

  render: ->
    {id, divisions, zoom, pixelsPerMeter,
     scrollToHeight, height, skeletal, range} = @props
    # Set text of header for appropriate zoom level
    txt = if zoom > 0.5 then "Section " else ""
    txt += id

    h "div#section-pane", [
      h "div.section-container", {
        className: if skeletal then "skeleton" else null
      }, [
        h 'div.section-header', [h "h2", txt]
        h ColumnProvider, {
          zoom
          range
          height
          divisions
          pixelsPerMeter
        }, (
          h ScrollToHeightComponent, {
            scrollToHeight: parseFloat(scrollToHeight)
            id
          }, [
            @renderInnerElements()
            @renderNotes()
          ]
        )
      ]
    ]

  renderNotes: =>
    {zoom, id} = @props
    return null unless @props.showNotes and zoom > 0.50
    h NotesColumn, {
      id
      visible: true
      width: @props.logWidth*zoom
      marginTop: @props.padding.top
    }

  onEditInterval: ({division, height})=>
    if not (@props.isEditable and division?)
      Notification.show {
        message: "Section #{@props.id} at #{fmt(height)} m"
      }
      return
    {id} = division
    console.log height
    @setState {editingInterval: {id, height}}

  renderSymbolColumn: =>
    {id} = @props
    return null unless @props.showSymbols
    h SymbolColumn, {id, left: 215}

  renderTriangleBars: =>
    return null unless @props.showTriangleBars
    order = @props.sequenceStratOrder
    h TriangleBars, {
      offsetLeft: -85, lineWidth: 25, orders: [order, order-1]
    }

  renderFloodingSurfaces: =>
    return null unless @props.showFloodingSurfaces
    h FloodingSurface

  renderCarbonIsotopes: =>
    return null unless @props.showCarbonIsotopes
    {id} = @props
    h Samples, {id}

  renderGeneralized: ({range})=>
    return null unless @props.activeDisplayMode == 'generalized'
    {lithologyWidth} = @props
    h GeneralizedSectionColumn, {range}, (
      h LithologyColumnInner, {width: range[1]}
    )

  renderFacies: =>
    {lithologyWidth, showFacies} = @props
    return null unless showFacies
    h FaciesColumnInner, {width: lithologyWidth}

  renderOverlaySVG: =>
    {lithologyWidth, zoom, id, height, pixelsPerMeter} = @props

    innerHeight = height*pixelsPerMeter
    {left, top, right, bottom} = @props.padding
    outerHeight = innerHeight+(top+bottom)
    outerWidth = innerWidth+(left+right)

    ticks = height/10

    range = [88,168]
      .map (d)->d*zoom
      .map (d)->d+lithologyWidth

    h "svg.overlay", {
      SVGNamespaces...
      width: outerWidth
      height: outerHeight
    }, [
      h 'g.backdrop', {
        transform: "translate(#{@props.padding.left} #{@props.padding.top})"
      }, [
        h SectionAxis, {ticks}
        h LithologyColumn, {width: lithologyWidth}, [
          @renderFacies()
          h CoveredOverlay, {width: lithologyWidth}
          h LithologyColumnInner, {width: lithologyWidth}
        ]
        h GrainsizeScale, {range}
        @renderGeneralized({range})
        @renderCarbonIsotopes()
        @renderFloodingSurfaces()
        @renderTriangleBars()
        @renderSymbolColumn()
      ]
    ]

  onIntervalUpdated: =>
    console.log "Updating intervals"
    {id: section} = @props
    # Could potentially make this fetch less
    divisions = await query 'lithology', [section]
    @setState {divisions}

  addInterval: (height)=>
    {id: section, editingInterval} = @props
    {id} = await db.one sql('add-interval'), {section,height}
    divisions = await query 'lithology', [section]
    {id: oldID, height} = editingInterval
    if oldID?
      editingInterval = {id, height}
    @setState {divisions, editingInterval}

  removeInterval: (id)=>
    {id: section} = @prop
    await db.none sql('remove-interval'), {section, id}
    divisions = await query 'lithology', [section]
    @setState {divisions, editingInterval: {id:null}}

SectionComponentHOC = (props)->
  {id, divisions} = props
  h SequenceStratConsumer, null, (value)->
    {showTriangleBars, showFloodingSurfaces, sequenceStratOrder} = value
    h ColumnDivisionsProvider, {id, divisions}, (rest)->
      h SectionComponent, {showTriangleBars, showFloodingSurfaces, sequenceStratOrder, rest..., props...}

export {SectionComponentHOC as SectionComponent}

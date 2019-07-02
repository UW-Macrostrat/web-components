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
import {ColumnProvider} from './context'
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
      loaded: false
      editingInterval: {id: null}
      visible: true
      scale: d3.scaleLinear().domain(@props.range)
      naturalHeight: d3.sum(@props.imageFiles, (d)->d.height)
    }

  getGeometry: =>
    innerHeight = @props.height*@props.pixelsPerMeter*@props.zoom
    padding = {}
    for k,v of @props.padding
      if k == 'left' or k == 'bottom'
        padding[k] = @props.padding[k]
      else
        padding[k] = @props.padding[k]*@props.zoom
    {left, top, right, bottom} = padding

    outerHeight = innerHeight+(top+bottom)
    innerWidth = @props.innerWidth*@props.zoom
    if innerWidth < @props.lithologyWidth
      innerWidth = @props.lithologyWidth
    outerWidth = innerWidth+(left+right)
    {padding, innerHeight, outerHeight, innerWidth, outerWidth}

  renderSectionImages: =>
    {zoom} = @props
    skeletal = false
    return unless zoom > 0.25 and @state.visible
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

    {heightOfTop, showFacies} = @props
    marginTop = heightOfTop*@props.pixelsPerMeter*@props.zoom
    style = {top: marginTop}

    h 'div.section', {style}, [
      h ModalEditor, {
        isOpen: editingInterval.id?
        interval: divisions.find (d)-> d.id == editingInterval.id
        height: editingInterval.height
        section: id
        onSelectFacies: @setFaciesForInterval
        onSelectGrainSize: @setGrainSizeForInterval
        onSelectFloodingSurfaceOrder: @setFloodingSurfaceOrderForInterval
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
      }
    ]

  render: ->
    {id, divisions, zoom, pixelsPerMeter, height, skeletal, range} = @props
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
        }, [
          h 'div.section-outer', [
            @renderInnerElements()
            @renderNotes()
          ]
        ]
      ]
    ]

  renderNotes: =>
    {zoom, id} = @props
    return null unless @props.showNotes and zoom > 0.50
    h NotesColumn, {
      id
      visible:true
      width: @props.logWidth*zoom
      marginTop: @props.padding.top
    }

  componentDidUpdate: ->
    node = findDOMNode(this)
    {scrollToHeight, id} = @props
    {scale, loaded} = @state
    return unless scrollToHeight?
    return if loaded
    scrollTop = scale(scrollToHeight)-window.innerHeight/2
    node.scrollTop = scrollTop

    Notification.show {
      message: "Section #{id} @ #{fmt(scrollToHeight)} m"
      intent: Intent.PRIMARY
    }
    @setState {loaded: true}

  onEditInterval: ({division, height})=>
    return unless @props.isEditable
    {id} = division
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

  renderGeneralized: ({range, innerHeight})=>
    return null unless @props.activeDisplayMode == 'generalized'
    {lithologyWidth} = @props

    h GeneralizedSectionColumn, {
      grainsizeScaleStart: range[0]-lithologyWidth
      width: range[1]-lithologyWidth
      left: lithologyWidth
      height: innerHeight
    }

  renderOverlaySVG: =>
    {innerHeight, outerHeight, innerWidth, outerWidth, padding} = @getGeometry()
    {showSymbols, isEditable, showFacies} = @props

    {lithologyWidth, zoom, id, isEditable, showFacies, lithologyWidth, divisions} = @props

    ticks = (@props.height*@props.zoom)/10

    range = [128,208].map (d)->d-40
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
          if showFacies then h(FaciesColumnInner, {width: lithologyWidth}) else null
          h CoveredOverlay, {width: lithologyWidth}
          h LithologyColumnInner, {width: lithologyWidth}
        ]
        h GrainsizeScale, {range}
        @renderGeneralized({range, innerHeight})
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
    {id: section} = @props

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

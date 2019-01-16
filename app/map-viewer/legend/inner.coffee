import * as d3 from "d3"
import "d3-selection-multi"
import {stratify} from "d3-hierarchy"
import {query, storedProcedure} from "../../db"
import classNames from "classnames"
import {Component, createContext} from "react"
import {findDOMNode} from "react-dom"
import "d3-jetpack"
import h from "react-hyperscript"
import {join} from "path"

createRow = (data)->
  console.log data

makeNested = (item)->
  # Recursively callable function to make nested data
  #
  item.each createRows

  header = item.append 'div'
    .attrs class: style.header

  header.append 'h1'
    .text (d)->
      d.data.name
  header.append 'p'
    .text (d)->
      d.data.desc

  color = (d)->d.data.color or 'white'

  c = item.append 'div'
    .attrs class: style.children

  children = c.selectAll 'div.child'
    .data (d)->
      vals = d.children or []
      vals.sort (a,b)->
        a.data.order < b.data.order
      vals.filter (d)->d.data.level?
    .enter()
      .append 'div'
      .attrs class: (d)->
        ch = d.children or []
        return classNames(
          "child",
           d.data.type or 'div',
           {nochildren: ch.length == 0})

  if not children.empty()
    children.call makeNested

makeUnit = (node)->
  {data,children} = node
  {unit_id, name, desc,
   level, type, is_map_unit, show_in_legend} = data

  if desc?
    desc = h 'p.desc', desc

  swatch = null
  if is_map_unit
    backgroundColor = data.color or "white"
    swatch = h 'div.swatch', {style: {backgroundColor}}

  console.log node
  parts = []

  if show_in_legend
    parts.push h 'div.header', [
      swatch
      h 'h1', name
      h('p.desc', desc) or null
    ]

  if children?
    children.sort (a,b)->
      a.data.order < b.data.order

    v = children
          .filter (d)->d.data.level?
          .map makeUnit

    parts.push h('div.children', v)

  className = classNames unit_id, type, "level-#{level}"
  h 'div.map-unit', {className}, parts


SwatchDataContext = createContext {swatches: []}

getSwatch = (id)->
  if PLATFORM == WEB
    dn = BASE_URL
  else
    dn = join(process.env.PROJECT_DIR,"versioned","Products")
  fn = join(dn,"map-patterns","#{id}.svg")

class Swatch extends Component
  render: ->
    {color, fgdc_symbol, unit_id} = @props
    style = {border: '1px solid #444', width: 30, height: 20}
    if fgdc_symbol?
      color = "url('#{getSwatch(unit_id)}')"
    style.background = color

    h 'div.swatch', {style}

class MapUnit extends Component
  render: ->
    h SwatchDataContext.Consumer, {}, (swatches)=>
      console.log swatches
      id = @props.children
      name = null
      if Array.isArray id
        [id,name,desc] = id
      console.log id, name, desc
      return unless swatches.length > 0
      swatchData = swatches.find (d)=>d.unit_id == id
      swatchData ?= {}
      {name: nameData} = swatchData
      if not name?
        name = nameData
      h 'div.unit', [
        h Swatch, swatchData
        h 'div.right', [
          h 'div.label', name
        ]
      ]

u = (d,name,desc)->h MapUnit, [d,name,desc]

class Group extends Component
  render: ->
    h 'div.unit-group', [
      h 'h1', @props.name
      @props.children
    ]

g = (n,c)->
  h Group, {name: n}, c

class MapLegendList extends Component
  @defaultProps: {}
  constructor: (props)->
    super props
    @state =
      data: []

    @createData()

  createData: ->
    data = await query("unit-data", null, {baseDir: __dirname})
    console.log data
    @setState {data}

  render: ->
    undiv = 'Undivided'

    h SwatchDataContext.Provider, {value: @state.data}, [
      h 'div#map-units-list', [
        g "Cover", [
          u 'alluvium'
          u 'colluvium'
          u 'tufa'
          u 'dune'
        ]
        g 'Footwall', [
          g 'Nama Group', [
            u 'urikos'
            u 'urusis'
            u 'houghland', 'Houghland Formation'
            g 'Omkyk Formation', [
              u 'upper-omkyk-grainstone', 'Biostrome (to upper)'
              u 'upper-omkyk', 'Upper'
              u 'middle-omkyk'
              u 'middle-omkyk-reef', 'Patch reef (to middle)'
              u 'lower-omkyk'
            ]
            u 'dabis'
          ]
          g 'Pre-Damara basement', [
            u 'newedam-group'
            u 'basement', "Igneous and metamorphic rocks"
          ]
        ]
        g 'Naukluft Nappe Complex', [
          g 'Zebra Nappe', [
            g 'Tafel Formation', [
              u 'adler', 'Upper'
              u 'zebra-limestone', 'Lower'
              u 'tafel', undiv
            ]
            g 'Onis Formation', [
              u 'upper-onis', 'Upper'
              u 'middle-onis', 'Middle'
              u 'lower-onis', 'Lower'
              u 'onis', undiv
            ]
            g 'Lemoenputs Formation', [
              u 'upper-lemoenputs', 'Upper'
              u 'lemoenputs-ooid', 'Bed B (to middle)'
              u 'middle-lemoenputs', 'Middle'
              u 'lemoenputs-a', 'Bed A (to lower)'
              u 'lower-lemoenputs', 'Lower'
            ]
            g 'Tsams Formation', [
              u 'tsams-c', 'Member C'
              u 'tsams-b', 'Member B'
              u 'tsams-a', 'Member A'
            ]
            u 'ubisis', 'Ubisis Formation'
            u 'neuras', "Neuras Formation"
          ]
          g 'Dassie Nappe', [
            u 'dassie', undiv
            u 'aubslucht', 'Shale component'
          ]
          g 'Pavian Nappe', [
            g 'Southern Pavian Nappe', [
              u 'bullsport-outlier', 'Büllsport outlier'
              u 'arbeit-adelt-outlier', "Arbeit Adelt outlier"
            ]
            u 'northern-pavian', 'Northern Pavian nappe'
          ]
          g 'Kudu Nappe', [
            u 'kudu', undiv
            u 'southern-pavian', 'Shale component'
          ]
        ]
      ]
    ]

  createLegend: =>
    {data} = @state


    data.push {unit_id: 'root', name: 'Legend', is_map_unit: false, show_in_legend: false}

    f = (key)->(d)->d[key]

    strat = stratify()
      .id f('unit_id')
      .parentId f('member_of')

    rootUnit = strat(data)
    makeUnit(rootUnit)



export {MapLegendList}

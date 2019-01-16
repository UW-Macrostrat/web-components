import d3 from "d3"
import "d3-selection-multi"
import {stratify} from "d3-hierarchy"
import style from "./main.styl"
import {query} from "../db"
import classNames from "classnames"

makeMapUnit = (d)->
  console.log d

makeNested = (item)->
  # Recursively callable function to make nested data
  #
  h = item.append 'div'
    .attrs class: style.header

  h.append 'h1'
    .text (d)->
      d.data.name
  h.append 'p'
    .text (d)->
      d.data.desc

  color = (d)->d.data.color or 'white'

  item.styles
    'border-color': color

  c = item.append 'div'
    .attrs class: style.children

  children = c.selectAll 'div.child'
    .data (d)->
      vals = d.children or []
      vals.sort (a,b)->
        a.data.order < b.data.order
      vals.filter (d)->d.data.level?
    .enter().append 'div'
      .attrs class: (d)->
        console.log d
        ch = d.children or []
        return classNames(
          "child",
           d.data.type or 'div',
           {nochildren: ch.length == 0})

  if not children.empty()
    children.call makeNested

createLegend = (el)->
  data = await query("unit-data",null, {baseDir: __dirname})

  wrap = d3.select el

  data.push unit_id: 'root', name: 'Legend'

  t = (key)->
    (d)->
      try
        return d[key].trim()
      catch
        return d[key]

  strat = stratify()
    .id t('unit_id')
    .parentId t('member_of')

  units = strat(data)

  wrap.append 'div'
    .datum units
    .attrs class: style.root
    .call makeNested

export createLegend

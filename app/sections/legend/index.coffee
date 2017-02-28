d3 = require 'd3'
require 'd3-selection-multi'
{stratify} = require 'd3-hierarchy'
Query = require '../database'
style = require './main.styl'

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
        t = d.data.type or 'div'
        val = "child #{style[t]}"
        children = d.children or []
        if children.length == 0
          val += " #{style['nochildren']}"
        return val

  if not children.empty()
    children.call makeNested

createLegend = (data)->
  wrap = d3.select '#wrap'

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

Query "#{__dirname}/unit-data.sql"
  .then (d)->d.rows
  .then createLegend

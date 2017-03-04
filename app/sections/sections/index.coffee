d3 = require "d3"
require 'd3-selection-multi'
fs = require 'fs'
yaml = require 'js-yaml'

Section = require './section'
ipc = require('electron').ipcRenderer
style = require './main.styl'

module.exports = (el)->
  console.log "Loading sections"

  f = fs.readFileSync "#{__dirname}/sections.yaml"
  sectionData = yaml.safeLoad f

  setZoom = (el)->
    el.styles zoom: (d)->d.zoom

  wrap = d3.select el
    .datum zoom: 1
    .call setZoom

  canvas = wrap.append 'div'
    .attrs id: 'canvas'

  sel = canvas.selectAll "div.section"
    .data sectionData

  index = {}

  sel.enter()
    .append 'div'
      .attrs class: 'section'
      .each (d)->
        el = d3.select @
        s = new Section el,d
        index[s.opts.id] = s

  reflowCorrelations = ->
  # Create correlations
  correlations = ->

    data = [
      {A:0,G:0},
      {A: 220,B:140,C:18,E:33,F:18}
      {A: 190,B:96,C:-15,E:-10,F:-20}
      {C: 140,D: -19}
      {D: 140,F: 150}]

    svg = wrap.select("#main")
      .append "svg"
      .attrs class: style.underlay

    path = d3.line()

    sel = svg.selectAll 'path'
      .data data

    sel.enter()
      .append 'path'
      .attrs class: style.correlation

    reflowCorrelations = ->
      console.log "Reflowing correlations"
      bbox = canvas.node().getBoundingClientRect()
      sel.attrs
        d: (d)->
          coords = []
          for k,v of d
            section = index[k]
            rect = section.el.node().getBoundingClientRect()
            ht = section.y(v) + rect.top + window.scrollY + 10
            console.log k,ht
            coords.push [rect.left-bbox.left, ht]
            coords.push [rect.left-bbox.left+(rect.width/2), ht]
          return path(coords)

    reflowCorrelations()

  ipc.on 'zoom-reset', ->
    console.log "Zoom reset"
    wrap
      .datum zoom: 1
      .call setZoom
    reflowCorrelations()

  ipc.on 'zoom-in', ->
    console.log "Zoom in"
    d = wrap.datum()
    d.zoom *= 1.25
    wrap
      .datum d
      .call setZoom
    reflowCorrelations()

  ipc.on 'zoom-out',->
    d = wrap.datum()
    d.zoom /= 1.25
    wrap
      .datum d
      .call setZoom
    reflowCorrelations()


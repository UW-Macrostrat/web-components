d3 = require 'd3'
module.exports = (el, cb)->
  d3.select el
    .append 'div'
    .attr 'id', 'main'
  window.location.hash = '#/sections/summary'
  require '../../main.coffee'
  require './print.styl'
  setTimeout cb, 3000


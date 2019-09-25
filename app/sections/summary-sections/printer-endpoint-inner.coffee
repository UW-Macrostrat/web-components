import * as d3 from "d3"
import '../../main'
import './print.styl'

fn = (el, cb)->
  console.log "HELLO"
  d3.select el
    .append 'div'
    .attr 'id', 'main'
  window.location.hash = '#/sections/summary'
  setTimeout cb, 3000

export default fn


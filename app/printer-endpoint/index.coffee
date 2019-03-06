import {render} from "react-dom"
import {createElement, Component} from "react"
import "./main.styl"
import {select} from "d3-selection"
import h from "react-hyperscript"
import moment from "moment"
import {getSectionData} from "../sections/section-data"
import {SectionPanel} from "../sections/panel"
import CarbonIsotopesPanel from "../carbon-isotopes"
import LateralVariation from "../lateral-variation/component"
import "@blueprintjs/core/dist/blueprint.css"
import "../sections/main.styl"
import "../sections/settings.styl"
import "../main.styl"

module.exports = (el, cb)->

  sections = await getSectionData()

  class Page extends Component
    render: ->
      date = moment().format('MMMM YYYY')
      h 'div.sections-print', [
        h 'div.title-section', [
          h 'h1', "Stratigraphy of the Zebra Nappe"
          h 'h2.info.location', "Southern Naukluft Mountains, Namibia"
          h 'h2.info.author', "Daven Quinn et al."
          h 'h2.info.date', "#{date} version"
        ]
        h SectionPanel, {sections, trackVisibility: false}
        h 'div.charts', [
          h 'div', [
            h 'h3', 'Schematic lithostratigraphy'
            h LateralVariation
          ]
          h 'div', [
            h 'h3', 'Carbon isotopes'
            h CarbonIsotopesPanel
          ]
        ]
      ]

  render(createElement(Page),el)

  fn = ->cb()
  setTimeout fn, 5000

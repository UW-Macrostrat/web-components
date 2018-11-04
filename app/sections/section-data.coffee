{query} = require '../db'
{getJSON} = require '../util'
{join} = require 'path'
Promise = require 'bluebird'
{Component, createContext} = require 'react'
{db, query, storedProcedure} = require './db'
{FaciesContext} = require './facies-descriptions'
{SequenceStratProvider} = require './sequence-strat-context'
h = require 'react-hyperscript'

sectionFilename = (fn)->
  if PLATFORM == ELECTRON
    dataDir = process.env.NAUKLUFT_DATA_DIR
    return join dataDir, "Sections", "Digitized Images", "web-images", fn
  else
    return join BASE_URL, 'images', fn

getSectionData = (opts={})->
  opts.verbose ?= false
  fn = sectionFilename('file-info.json')
  config = await getJSON fn

  query 'sections', null, {baseDir: __dirname}
    .map (s)->
      s.id = s.section.trim()
      files = config[s.id] or []
      s.range = [s.start, s.end]
      # Height in meters
      s.height = s.end-s.start

      scaleFactor = files.height/s.height
      if opts.verbose
        console.log "Section #{s.id} scale factor: #{scaleFactor} px/m"

      sz = 427
      s.scaleFactor = scaleFactor
      s.imageFiles = [1..files.n].map (i)->
        filename = sectionFilename("section_#{s.id}_#{i}.png")
        remaining = files.height-(i-1)*sz
        height = if remaining > sz then sz else remaining
        {width: sz, height, filename}
      return s

class SectionDataProvider extends Component
  render: ->
    {facies, surfaces} = @props
    h FaciesProvider, {facies, surfaces}, [
      h SequenceStratProvider, null, @props.children
    ]


SectionContext = createContext({})

class SectionDataProvider extends Component
  constructor: (props)->
    super props
    @state = {
      sections: []
      facies: []
      surfaces: []
    }

  getInitialData: ->
    getSectionData()
      .then (sections)=>@setState {sections}
    query('section-surface', null, {baseDir: __dirname})
      .then (surfaces)=>@setState {surfaces}
    @getFaciesData()

  getFaciesData: =>
    query('facies', null, {baseDir: __dirname})
      .then (facies)=>@setState {facies}

  componentDidMount: ->
    @getInitialData()

  changeFaciesColor: (id,color)=>
    sql = storedProcedure('set-facies-color', {baseDir: __dirname})
    await db.none sql, {id,color}
    @getFaciesData()

  render: ->
    {facies, surfaces, sections} = @state
    value = {facies, surfaces, onColorChanged: @changeFaciesColor}
    h FaciesContext.Provider, {value}, [
      h SequenceStratProvider, null, [
        h SectionContext.Provider, {value: {sections}}, @props.children
      ]
    ]

SectionConsumer = SectionContext.Consumer

module.exports = { getSectionData, SectionDataProvider, SectionConsumer }

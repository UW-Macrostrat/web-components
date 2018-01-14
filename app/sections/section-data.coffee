{query} = require '../db'
{getJSON} = require '../util'
{join} = require 'path'
Promise = require 'bluebird'

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

module.exports = { getSectionData }

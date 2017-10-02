{query} = require '../db'
{getJSON} = require '../db/util'
{join} = require 'path'
Promise = require 'bluebird'

sectionFilename = (fn, dataDir)->
  dataDir ?= process.env.NAUKLUFT_DATA_DIR
  join dataDir, "Sections", "Digitized Images", "extracted-clipped", fn

getSectionData = (dataDir)->
  fn = sectionFilename('file-info.json', dataDir)
  config = await getJSON fn

  query 'sections', null, {baseDir: __dirname}
    .map (s)->
      s.id = s.section.trim()
      files = config[s.id] or []
      s.range = [s.start, s.end]
      # Height in meters
      s.height = s.end-s.start
      s.imageFiles = files.reverse().map (d)->
        d.filename = sectionFilename(d.filename)
        return d
      return s

module.exports = { getSectionData }

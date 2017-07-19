{db, storedProcedure} = require './db'
{join} = require 'path'
{readFileSync} = require 'fs'

sectionFilename = (fn, dataDir)->
  dataDir ?= process.env.NAUKLUFT_DATA_DIR
  join dataDir, "Sections", "Digitized Images", "extracted-clipped", fn

getSectionData = (dataDir)->
  fn = sectionFilename('file-info.json', dataDir)
  _ = readFileSync fn, 'utf-8'
  config = JSON.parse _

  console.log config
  db.query storedProcedure('sections')
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

module.exports = { sectionFilename, getSectionData }

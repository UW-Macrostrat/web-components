{join} = require 'path'
Promise = require 'bluebird'
req = require 'request-promise'
{getUID, getHash} = require './util'

if PLATFORM == ELECTRON
  {db, storedProcedure, serializableQueries} = require './backend'
  OUTPUT_DIRECTORY = join(process.env.PROJECT_DIR,"versioned","Products","webroot","queries")

__queryList = null
query = (id, values)->
  ###
  Generalized query that picks the best method for
  getting query variables
  ###
  if not SERIALIZED_QUERIES
    func = -> db.query storedProcedure(id), values
    if not __queryList?
      p = serializableQueries()
        .then (d)-> __queryList = d
    else
      p = null
    return Promise.resolve(p)
      .then ->
        db.query storedProcedure(id), values

  # We get JSON from our library of stored queries
  fn = getHash(id,values)+'.json'
  console.log "Getting query file `#{fn}`"

  if PLATFORM == ELECTRON
    # We can do a direct require
    data = require "#{OUTPUT_DIRECTORY}/#{fn}"
    return Promise.resolve(data)
  else
    return req {
      uri: "file://#{OUTPUT_DIRECTORY}/#{fn}"
      json: true
    }

getAllSections = ->
  query('sections')

module.exports = {
  query
  getAllSections
  storedProcedure
  db
  sectionData: (id)->
    db.one storedProcedure('section'),[id]
}


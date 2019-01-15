{join} = require 'path'
Promise = require 'bluebird'
{getUID, getHash} = require './util'
{getJSON} = require '../util'

if PLATFORM == ELECTRON
  {db, storedProcedure, serializableQueries} = require './backend'
  QUERY_DIRECTORY = join(process.env.PROJECT_DIR,"versioned","Products","webroot","queries")
else
  QUERY_DIRECTORY = join(BASE_URL,"queries")

__queryList = null
query = (id, values, opts={})->
  ###
  Generalized query that picks the best method for
  getting query variables
  ###
  {baseDir} = opts
  if not SERIALIZED_QUERIES
    # Get data directly from database (only works on backend)
    func = -> db.query storedProcedure(id, {baseDir}), values
    if not __queryList?
      ## Get a list of potentially serializable queries
      # before returning queries
      p = serializableQueries()
        .then (d)-> __queryList = d
    else
      p = null
    return Promise.resolve(p)
      .then ->
        db.query storedProcedure(id, {baseDir}), values

  # We get JSON from our library of stored queries
  fn = id+"_"+getHash(id,values)+'.json'
  console.log "Getting query file `#{fn}` for query `#{id}` with values #{values}"
  data = getJSON "#{QUERY_DIRECTORY}/#{fn}"
  return data

module.exports = {
  query
  storedProcedure
  db
}


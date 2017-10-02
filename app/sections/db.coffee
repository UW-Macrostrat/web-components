{join} = require 'path'
Promise = require 'bluebird'
{createHash} = require 'crypto'
req = require 'request-promise'

OUTPUT_DIRECTORY = join(process.env.PROJECT_DIR,"versioned","Products","webroot","queries")

opts = {
  promiseLib: Promise
  query: (e)=>
    console.log e.query
    v = queryLibrary.find (d)->
      d.sql == e.query
    if not v?
      console.warn "No serialization spec found matching this query.
                    This request will fail on the frontend."
}

pgp = require('pg-promise')(opts)
db = pgp('postgresql:///Naukluft')

storedProcedure = (id)->
  if not id.endsWith('.sql')
    id = join(__dirname,'sql',"#{id}.sql")
  pgp.QueryFile(id)

queryLibrary = []

getUID = (id, values)->
  id+JSON.stringify(values)

getHash = (id,values)->
  uid = getUID id, values
  md5sum = createHash('md5')
  md5sum.update(uid).digest('hex')

# Serialize queries based on query file and opts
class SerializableQuery
  constructor: (@id, @values)->
    query = storedProcedure(@id)
    @sql = pgp.as.format(query, @values)
    @uid = getUID @id, @values
    @hash = getHash @id, @values
    queryLibrary.push(@)
  getData: -> db.query @sql
  filename: -> query.hash+'.json'
  path: ->
    join OUTPUT_DIRECTORY, @filename()

new SerializableQuery('sections')
new SerializableQuery('carbon-isotopes')

sectionLabels = null
sectionQueries =  [
  'flooding-surface'
  'section-samples'
  'lithology'
  'log-notes'
]

query = (id, values)->
  ###
  Generalized query that picks the best method for
  getting query variables
  ###
  if not SERIALIZED_QUERIES
    # We can do a direct query
    return db.query storedProcedure(id), values

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

createSerializedQueries = ->
  for q in sectionQueries
    for l in sectionLabels
      v = new SerializableQuery(q,[l])

getAllSections = ->
  query('sections')
    .tap (sections)->
      # Prepare section labels for serialization
      return if sectionLabels?
      sectionLabels = sections.map (d)->d.section
      createSerializedQueries()

serializableQueries = ->
  ## Return a list of serializable queries for writing
  # out to files
  await getAllSections()
  createSerializedQueries()
  return queryLibrary

module.exports = {
  query
  serializableQueries
  getAllSections
  storedProcedure
  db
  sectionData: (id)->
    db.one storedProcedure('section'),[id]
}


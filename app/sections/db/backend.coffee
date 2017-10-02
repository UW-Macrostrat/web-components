{join} = require 'path'
Promise = require 'bluebird'
{getUID, getHash} = require './util'

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

new SerializableQuery('sections')
new SerializableQuery('carbon-isotopes')

sectionLabels = null
sectionQueries =  [
  'flooding-surface'
  'section-samples'
  'lithology'
  'log-notes'
]

createSerializedQueries = ->
  for q in sectionQueries
    for l in sectionLabels
      v = new SerializableQuery(q,[l])

serializableQueries = ->
  ## Return a list of serializable queries for writing
  # out to files
  sections = await db.query storedProcedure('sections')
  return if sectionLabels?
  sectionLabels = sections.map (d)->d.section
  createSerializedQueries()

  createSerializedQueries()
  return queryLibrary


module.exports = {
  db, storedProcedure, serializableQueries
}

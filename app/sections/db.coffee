{join} = require 'path'
Promise = require 'bluebird'
{createHash} = require 'crypto'

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

md5sum = createHash('md5')

queryLibrary = []

# Serialize queries based on query file and opts
class SerializableQuery
  constructor: (@id, @values)->
    query = storedProcedure(@id)
    @sql = pgp.as.format(query, @values)
    # Get the hash for the parameterized query
    queryLibrary.push(@)
  uid: ->
    @id+JSON.stringify(@values)
  hash: ->
    v = @uid()
    md5sum.update(v).digest('hex')

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
      console.log v.uid()

getAllSections = ->
  console.log "Getting all sections from database"
  db.query storedProcedure('sections')
    .tap (sections)->
      # Prepare section labels for serialization
      return if sectionLabels?
      sectionLabels = sections.map (d)->d.section
      createSerializedQueries()

module.exports = {
  getAllSections
  storedProcedure
  db
  sectionData: (id)->
    db.one storedProcedure('section'),[id]
}


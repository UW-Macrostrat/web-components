{join} = require 'path'
Promise = require 'bluebird'
{createHash} = require 'crypto'

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

# Serialize queries based on query file and opts
class SerializableQuery
  constructor: (@id, @values)->
    query = storedProcedure(@id)
    @sql = pgp.as.format(query, @values)
    @uid = @id+JSON.stringify(@values)
    md5sum = createHash('md5')
    @hash = md5sum.update(@uid).digest('hex')
    # Get the hash for the parameterized query
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

createSerializedQueries = ->
  for q in sectionQueries
    for l in sectionLabels
      v = new SerializableQuery(q,[l])

getAllSections = ->
  console.log "Getting all sections from database"
  db.query storedProcedure('sections')
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
  serializableQueries
  getAllSections
  storedProcedure
  db
  sectionData: (id)->
    db.one storedProcedure('section'),[id]
}


{join} = require 'path'
Promise = require 'bluebird'
{createHash} = require 'crypto'

opts = {
  promiseLib: Promise
  query: (e)=>
    console.log e.query
    v = SerializableQuery.library.find (d)->
      d.sql == e.query
    console.log v
}

pgp = require('pg-promise')(opts)
db = pgp('postgresql:///Naukluft')

storedProcedure = (id)->
  if not id.endsWith('.sql')
    id = join(__dirname,'sql',"#{id}.sql")
  pgp.QueryFile(id)

md5sum = createHash('md5')

# Serialize queries based on query file and opts
class SerializableQuery
  @library: []
  constructor: (@id, @values)->
    query = storedProcedure(@id)
    @sql = pgp.as.format(query, @values)
    # Get the hash for the parameterized query
    @constructor.library.push(@)
  hash: ->
    v = @id+JSON.stringify(@values)
    md5sum(v)

new SerializableQuery('sections')


getAllSections = ->
  console.log "Getting all sections from database"
  db.query storedProcedure('sections')

module.exports = {
  getAllSections
  storedProcedure
  db
  sectionData: (id)->
    db.one storedProcedure('section'),[id]
}


{join} = require 'path'
Promise = require 'bluebird'

opts = {
  promiseLib: Promise
  query: (e)=>console.log e.query
}


try
  pgp = require('pg-promise')(opts)
  db = pgp('postgresql:///Naukluft')
catch
  db = null

storedProcedure = (id)->
  if not id.endsWith('.sql')
    id = join(__dirname,'sql',"#{id}.sql")
  pgp.QueryFile(id)

getAllSections = ->
  console.log "Getting all sections from database"
  db.query storedProcedure('sections')

module.exports = {
  getAllSections
  storedProcedure
  db: db
  sectionData: (id)->
    _ = storedProcedure('section')
    console.log "Section data"
    console.log _
    db.one _,[id]
}


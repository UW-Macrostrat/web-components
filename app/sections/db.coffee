{join} = require 'path'
Promise = require 'bluebird'
try
  pgp = require('pg-promise')(promiseLib: Promise)
  db = pgp('postgresql:///Naukluft')
catch
  db = null

proc = (id)->
  if not id.endsWith('.sql')
    id = join(__dirname,'sql',"#{id}.sql")
  pgp.QueryFile(id)

module.exports =
  storedProcedure: proc
  db: db
  sectionData: (id)->db.one proc('section'),[id]


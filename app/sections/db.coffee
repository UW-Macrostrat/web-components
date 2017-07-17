{join} = require 'path'
Promise = require 'bluebird'
pgp = require('pg-promise')(promiseLib: Promise)
db = pgp('postgresql:///Naukluft')

proc = (id)->
  if not id.endsWith('.sql')
    id = join(__dirname,'sql',"#{id}.sql")
  pgp.QueryFile(id)

module.exports =
  storedProcedure: proc
  db: db
  sectionData: (id)->db.one proc('section'),[id]


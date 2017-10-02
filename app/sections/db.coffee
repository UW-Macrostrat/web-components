{db, storedProcedure, query} = require '../db'
baseDir = __dirname
newQuery = (id, values)->
  query(id,values, {baseDir: __dirname})

module.exports = {db,storedProcedure,query: newQuery}

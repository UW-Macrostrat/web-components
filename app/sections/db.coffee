import {db, storedProcedure, query} from "../db"
baseDir = __dirname
newQuery = (id, values)->
  query(id,values, {baseDir: __dirname})

export {
  db,
  storedProcedure,
  newQuery as query
}

pg = require 'pg'
fs = require 'fs'
Promise = require 'bluebird'
Promise.promisifyAll pg

conString = "postgres://localhost/Naukluft"

module.exports = ->
  args = Array.apply(null, arguments)
  sql = args[0]
  # Check if we are dealing with a file
  if sql.trim().endsWith('.sql')
    f = fs.readFileSync sql
    sql = f.toString()

  data = args[1]

  pg.connectAsync(conString)
    .then (client)->client.queryAsync(sql,data)

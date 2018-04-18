{join} = require 'path'
{createHash} = require 'crypto'

# Queries have to have unique identifiers and combinations of parameters

getUID = (id, values)->
  return JSON.stringify([id,values])

getHash = (id,values)->
  uid = getUID id,values
  console.log "Hashing: #{uid}"
  md5sum = createHash('md5')
  md5sum.update(uid).digest('hex')

module.exports = { getUID, getHash }

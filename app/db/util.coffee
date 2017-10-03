{join} = require 'path'
{createHash} = require 'crypto'

# Queries have to have unique identifiers and combinations of parameters

getUID = (id, values)->
  v = JSON.stringify([id,values])
  console.log v
  return v

getHash = (id,values)->
  uid = getUID id,values
  md5sum = createHash('md5')
  md5sum.update(uid).digest('hex')

module.exports = { getUID, getHash }

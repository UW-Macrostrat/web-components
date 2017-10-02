{join} = require 'path'
{createHash} = require 'crypto'
req = require 'request-promise'

getUID = (id, values)->
  id+JSON.stringify(values)

getHash = (id,values)->
  uid = getUID id, values
  md5sum = createHash('md5')
  md5sum.update(uid).digest('hex')

module.exports = { getUID, getHash }

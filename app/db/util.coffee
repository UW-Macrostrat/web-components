{join} = require 'path'
{createHash} = require 'crypto'

getUID = ->
  JSON.stringify(arguments)

getHash = ->
  uid = getUID arguments
  md5sum = createHash('md5')
  md5sum.update(uid).digest('hex')

module.exports = { getUID, getHash }

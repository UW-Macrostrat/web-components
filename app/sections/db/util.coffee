{join} = require 'path'
{createHash} = require 'crypto'
req = require 'request-promise'
Promise = require 'bluebird'

getUID = (id, values)->
  id+JSON.stringify(values)

getHash = (id,values)->
  uid = getUID id, values
  md5sum = createHash('md5')
  md5sum.update(uid).digest('hex')

getJSON = (url)->
  if PLATFORM == ELECTRON
    # We can do a direct require
    data = require url
    return Promise.resolve(data)
  else
    return req {
      uri: url
      json: true
    }

module.exports = { getUID, getHash, getJSON }

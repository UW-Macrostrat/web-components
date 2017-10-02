{join} = require 'path'
{createHash} = require 'crypto'
req = require 'browser-request'
Promise = require 'bluebird'

getUID = (id, values)->
  id+JSON.stringify(values)

getHash = (id,values)->
  uid = getUID id, values
  md5sum = createHash('md5')
  md5sum.update(uid).digest('hex')

getJSON = (url)->
  if window?
    # We are using a web-like backend
    return Promise (res, rej)->
      req {uri: url, json: true}, (err, data)->
        if err?
          reject(err)
          return
        res(data)
  else
    # Assume we can do a direct require
    data = require url
    return Promise.resolve(data)


module.exports = { getUID, getHash, getJSON }

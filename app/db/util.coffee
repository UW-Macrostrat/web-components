{join} = require 'path'
{createHash} = require 'crypto'
Promise = require 'bluebird'

getUID = ->
  JSON.stringify(arguments)

getHash = ->
  uid = getUID arguments
  md5sum = createHash('md5')
  md5sum.update(uid).digest('hex')

getJSON = (url)->
  if window? and not PLATFORM == ELECTRON
    # We are using a web-like backend
    return new Promise (res, rej)->
      req = require 'browser-request'
      req {uri: url, json: true}, (err, data)->
        if err?
          reject(err)
          return
        res(data)
  else
    # Assume we can do a direct require
    {readFileSync} = require 'fs'
    data = JSON.parse readFileSync url
    return Promise.resolve(data)


module.exports = { getUID, getHash, getJSON }

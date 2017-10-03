{safeLoad} = require 'js-yaml'
Promise = require 'bluebird'

getJSON = (url)->
  if window? and PLATFORM != ELECTRON
    # We are using a web-like backend
    console.log "Requesting json at #{url}"
    return new Promise (resolve, reject)->
      req = require 'browser-request'
      req {uri: url, json: true}, (err, response)->
        if err?
          reject(err)
          return
        resolve(response.body)
  else
    # Assume we can do a direct require
    {readFileSync} = require 'fs'
    data = JSON.parse readFileSync url
    return Promise.resolve(data)

getYAML = (url)->
  if window? and PLATFORM != ELECTRON
    return new Promise (res, rej)->
      req = require 'browser-request'
      req {uri: url}, (err, text)->
        if err?
          reject(err)
          return
        data = safeLoad text
        res(data)
  else
    # Assume we can do a direct require
    {readFileSync} = require 'fs'
    data = safeLoad readFileSync url
    return Promise.resolve(data)

module.exports = {getJSON, getYAML}

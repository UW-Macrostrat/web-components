import {safeLoad} from "js-yaml"
import Promise from "bluebird"

getJSON = (url)->
  if window? and PLATFORM != ELECTRON
    console.log "Web backend found!!"
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
    return new Promise (resolve, reject)->
      req = require 'browser-request'
      req {uri: url}, (err, response)->
        if err?
          reject(err)
          return
        text = response.body
        data = safeLoad text
        resolve(data)
  else
    # Assume we can do a direct require
    {readFileSync} = require 'fs'
    data = safeLoad readFileSync url
    return Promise.resolve(data)

export {getJSON, getYAML}

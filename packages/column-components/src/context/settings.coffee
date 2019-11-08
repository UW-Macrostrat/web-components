import h from 'react-hyperscript'
import {createContext, useState, useContext} from 'react'
import update from 'immutability-helper'
import LocalStorage from '../util/storage'
import T from 'prop-types'

SettingsUpdateContext = createContext()
SettingsContext = createContext()

# Could rework this to use `constate` or similar

SettingsProvider = (props)->
  ###
  A settings provider that can be used with LocalStorage
  ###
  {storageID, children, defaultSettings...} = props
  # Update from local storage
  storage = null
  if storageID?
    # Merge initial options if set
    storage = new LocalStorage(storageID)
    v = storage.get() or {}
    console.log "Loading from local storage", v
    defaultSettings = update(defaultSettings, {$merge: v})

  [settings, setState] = useState(defaultSettings)
  updateState = (spec)->
    newSettings = update(settings, spec)
    setState(newSettings)
    if storage? then storage.set(newSettings)

  h SettingsContext.Provider, {value: settings}, [
    h SettingsUpdateContext.Provider, {value: updateState}, children
  ]

SettingsProvider.propTypes = {
  storageID: T.string
}

useSettings = ->
  useContext(SettingsContext)

updateSettings = (func)->
  # Update settings using `immutability-helper` semantics
  updater = useContext(SettingsUpdateContext)
  return -> updater(func(arguments...))

export {SettingsProvider, SettingsContext, useSettings, updateSettings}

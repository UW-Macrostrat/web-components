import {Component, createContext} from "react"
import h from "react-hyperscript"
import {join, resolve} from "path"
import LocalStorage from "./sections/storage"
import update from "immutability-helper"

## Set whether we are on the backend or frontend
global.ELECTRON = 'electron'
global.WEB = 'web'
global.PLATFORM = ELECTRON
global.SERIALIZED_QUERIES = false
try
  require 'electron'
  global.BASE_DIR = resolve join(__dirname,'..')
catch
  global.PLATFORM = WEB
  global.SERIALIZED_QUERIES = true
  global.BASE_URL = ""
console.log "Running application on #{PLATFORM}"

Platform = Object.freeze {
  DESKTOP: 1
  WEB: 2
  PRINT: 3
}

PlatformContext = createContext()

class PlatformProvider extends Component
  constructor: (props)->
    WEB = false
    ELECTRON = true
    platform = Platform.ELECTRON
    baseUrl = 'file://'+resolve(BASE_DIR)
    editable = true
    if global.PLATFORM == WEB
      platform = Platform.WEB
      WEB = true
      editable = false
      baseUrl = BASE_URL

    super props
    @state = {
      serializedQueries: not ELECTRON
      inEditMode: false
      platform, WEB, ELECTRON, editable, baseUrl
    }

    @storage = new LocalStorage 'edit-mode'
    v = @storage.get()
    return unless v?
    @state = update @state, {inEditMode: {$set: v}}

  render: ->
    {computePhotoPath, resolveSymbol, resolveLithologySymbol, updateState} = @
    {serializedQueries, restState...} = @state
    if @state.platform == Platform.WEB
      serializedQueries = true
    {children, rest...} = @props
    value = {rest..., restState..., serializedQueries, updateState, computePhotoPath,
             resolveSymbol, resolveLithologySymbol}
    h PlatformContext.Provider, {value}, children

  path: (args...)=>
    join(@state.baseUrl, args...)

  updateState: (val)=>
    @setState val

  computePhotoPath: (photo)=>
    if @state.ELECTRON
      return @path( '..', 'Products', 'webroot', 'Sections', 'photos', "#{photo.id}.jpg")
    else
      return @path( 'photos', "#{photo.id}.jpg")
    # Original photo
    return photo.path

  resolveSymbol: (sym)=>
    try
      if @state.ELECTRON
        q = resolve join(BASE_DIR, 'assets', sym)
        return 'file://'+q
      else
        return join BASE_URL, 'assets', sym
    catch
      return ''

  resolveLithologySymbol: (id)=>
    try
      if @state.ELECTRON
        q = require.resolve "geologic-patterns/assets/png/#{id}.png"
        return 'file://'+q
      else
        return @path 'assets', 'lithology-patterns',"#{id}.png"
    catch
      return ''

  componentDidUpdate: (prevProps, prevState)->
    # Shim global state
    if prevState.serializedQueries != @state.serializedQueries
      global.SERIALIZED_QUERIES = @state.serializedQueries

    {inEditMode} = @state
    if prevState.inEditMode != inEditMode
      @storage.set {inEditMode}

PlatformConsumer = PlatformContext.Consumer

export {PlatformContext, Platform, PlatformProvider, PlatformConsumer}

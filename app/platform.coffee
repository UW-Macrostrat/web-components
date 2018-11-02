{Component, createContext} = require 'react'
h = require 'react-hyperscript'
{join, resolve} = require 'path'
## Set whether we are on the backend or frontend
global.ELECTRON = 'electron'
global.WEB = 'web'
global.PLATFORM = ELECTRON
global.SERIALIZED_QUERIES = false
try
  require 'electron'
  {resolve, join} = require 'path'
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
    ELECTRON = false
    if global.PLATFORM == WEB
      platform = Platform.WEB
      WEB = true
      editable = false
      baseUrl = BASE_URL
    else
      platform = Platform.ELECTRON
      ELECTRON = true
      editable = true
      baseUrl = 'file://'+resolve(BASE_DIR)

    props = {platform, WEB, ELECTRON, editable, baseUrl}
    super props
    @state = {
      serializedQueries: not ELECTRON
      inEditMode: false
    }

  render: ->
    {computePhotoPath, resolveSymbol, resolveLithologySymbol, updateState} = @
    {serializedQueries, restState...} = @state
    if @props.platform == Platform.WEB
      serializedQueries = true
    {children, rest...} = @props
    value = {rest..., restState..., serializedQueries, updateState, computePhotoPath,
             resolveSymbol, resolveLithologySymbol}
    h PlatformContext.Provider, {value}, children

  path: (args...)->
    join(@props.baseUrl, args...)

  updateState: (val)=>
    @setState val

  computePhotoPath: (photo)=>
    if @props.ELECTRON
      return @path( '..', 'Products', 'webroot', 'Sections', 'photos', "#{photo.id}.jpg")
    else
      return @path( 'photos', "#{photo.id}.jpg")
    # Original photo
    return photo.path

  resolveSymbol: (sym)=>
    try
      if @props.ELECTRON
        q = resolve join(BASE_DIR, 'assets', sym)
        return 'file://'+q
      else
        return join BASE_URL, 'assets', sym
    catch
      return ''

  resolveLithologySymbol: (id)=>
    try
      if @props.ELECTRON
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

PlatformConsumer = PlatformContext.Consumer

module.exports = {PlatformContext, Platform, PlatformProvider, PlatformConsumer}

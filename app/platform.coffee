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
    super props
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

    @state = {platform, WEB, ELECTRON, editable, baseUrl}

  render: ->
    {computePhotoPath, resolveSymbol, resolveLithologySymbol} = @

    value = {@state..., computePhotoPath,
             resolveSymbol, resolveLithologySymbol}
    h PlatformContext.Provider, {value}, @props.children

  path: (args...)->
    join(@state.baseUrl, args...)

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

PlatformConsumer = PlatformContext.Consumer

module.exports = {PlatformContext, Platform, PlatformProvider, PlatformConsumer}

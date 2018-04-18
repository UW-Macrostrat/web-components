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

class PlatformData
  constructor: ->
    @WEB = false
    @ELECTRON = false
    if global.PLATFORM == WEB
      @platform = Platform.WEB
      @WEB = true
      @editable = false
      @baseUrl = BASE_URL
    else
      @platform = Platform.ELECTRON
      @ELECTRON = true
      @editable = true
      @baseUrl = 'file://'+resolve(BASE_DIR)

  computePhotoPath: (photo)=>
    if @ELECTRON
        return join(@baseUrl, '..', 'Products', 'webroot', 'Sections', 'photos', "#{photo.id}.jpg")
      else
        return join(@baseUrl, 'photos', "#{photo.id}.jpg")
    # Original photo
    return photo.path

  resolveSymbol: (sym)->
    try
      if @ELECTRON
        q = resolve join(BASE_DIR, 'assets', sym)
        return 'file://'+q
      else
        return join BASE_URL, 'assets', sym
    catch
      return ''

  resolveLithologySymbol: (id)=>
    try
      if @ELECTRON
        q = require.resolve "geologic-patterns/assets/png/#{id}.png"
        return 'file://'+q
      else
        return join @baseUrl, 'assets', 'lithology-patterns',"#{id}.png"
    catch
      return ''


PlatformContext = createContext()

class PlatformProvider extends Component
  render: ->
    h PlatformContext.Provider, {value: new PlatformData}, @props.children

module.exports = {PlatformContext, Platform, PlatformProvider}

import {Component, createContext} from "react"
import h from "react-hyperscript"
import {join} from "path"
import T from 'prop-types'

AssetPathContext = createContext {}

class AssetPathProvider extends Component
  @propTypes: {
    baseURL: T.string.isRequired
  }
  render: ->
    {resolveSymbol, resolveLithologySymbol} = @
    value = {resolveSymbol, resolveLithologySymbol}
    h AssetPathContext.Provider, {value}, children

  resolveSymbol: (sym)=>
    return join BASE_URL, 'assets', sym

  resolveLithologySymbol: (id, opts={})=>
    {baseURL} = @props
    {svg} = opts
    svg ?= false
    return null if not id?
    return join(baseURL,'assets','lithology-patterns', "#{id}.png")

export {AssetPathContext, AssetPathProvider}

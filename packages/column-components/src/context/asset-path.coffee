import {createContext} from "react"
import h from "react-hyperscript"
import {join} from "path"
import T from 'prop-types'
import {GeologicPatternProvider} from '../lithology/patterns'

AssetPathContext = createContext()

AssetPathProvider = (props)->
  {children, baseURL} = props

  resolveSymbol = (sym)->
    return null unless sym?
    console.log arguments
    return join baseURL, 'assets', sym

  h AssetPathContext.Provider, {
    value: {resolveSymbol}
  }, children

AssetPathProvider.propTypes = {
  baseURL: T.string.isRequired
}

export {
  AssetPathContext,
  AssetPathProvider
}

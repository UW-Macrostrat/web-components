import {createContext} from "react"
import h from "react-hyperscript"
import {join} from "path"
import T from 'prop-types'
import {GeologicPatternProvider} from '../lithology/patterns'

AssetPathContext = createContext()

AssetPathProvider = (props)->
  {children, resolveSymbol} = props

  h AssetPathContext.Provider, {
    value: {resolveSymbol}
  }, children

AssetPathProvider.propTypes = {
  resolveSymbol: T.func.isRequired
}

export {
  AssetPathContext,
  AssetPathProvider
}

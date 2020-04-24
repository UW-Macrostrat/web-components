import { createContext } from 'react'
import h from 'react-hyperscript'

const MapContext = createContext({})

const MapProvider = props => {
  const { projection, children } = props
  return h(MapContext.Provider, { value: { projection } }, children)
}

export { MapContext, MapProvider }

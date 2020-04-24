/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, createContext } from 'react'
import h from 'react-hyperscript'

const MapContext = createContext({})

class MapProvider extends Component {
  render() {
    const { projection, children } = this.props
    return h(MapContext.Provider, { value: { projection } }, children)
  }
}

export { MapContext, MapProvider }

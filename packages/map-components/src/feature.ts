import { useContext } from 'react'
import h from 'react-hyperscript'
import { MapContext } from './context'
import { CanvasLayer, MapCanvasContext } from './canvas-layer'

interface IFeatureProps {
  id: number | string
  geometry: object
  properties?: object
}

const Feature = (props: IFeatureProps) => {
  const { geometry, id, properties, ...rest } = props
  const { inCanvas, context } = useContext(MapCanvasContext)

  if (inCanvas) {
    const { renderPath } = useContext(MapCanvasContext)
    if (context != null) {
      renderPath(geometry)
    }
    return null
  } else {
    const { renderPath } = useContext(MapContext)
    const d = renderPath(geometry)
    return h('path', { d, className: `feature-${id}`, ...rest })
  }
}

interface IFeatureLayerProps {
  geometry?: object
  features?: object[]
  useCanvas?: boolean
}

const FeatureLayer = (props: IFeatureLayerProps) => {
  const { useCanvas, features, geometry, children, ...rest } = props

  let newChildren = null
  if (features != null) {
    newChildren = features.map(d => h(Feature, d))
  } else if (geometry != null) {
    newChildren = h(Feature, { id: 0, geometry })
  }

  const el = useCanvas ? CanvasLayer : 'g'

  return h(el, rest, [children, newChildren])
}

FeatureLayer.defaultProps = {
  useCanvas: false
}

export { FeatureLayer, Feature }

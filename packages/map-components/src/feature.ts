import { useContext } from 'react'
import h from '@macrostrat/hyper'
import { MapContext } from './context'
import { CanvasLayer, MapCanvasContext } from './canvas-layer'

export interface IFeature {
  id: number | string
  geometry: object
  properties?: object
}

interface IFeatureProps {
  feature: IFeature
  [key: string]: any
}

const Feature = (props: IFeatureProps) => {
  const { feature, onClick, ...rest } = props
  const { inCanvas, context } = useContext(MapCanvasContext)
  const { geometry, properties, id } = feature

  if (inCanvas) {
    const { renderPath } = useContext(MapCanvasContext)
    if (context != null) {
      renderPath(geometry)
    }
    return null
  } else {
    const { renderPath } = useContext(MapContext)
    const d = renderPath(geometry)
    return h('path.feature', {
      d,
      className: `feature-${id}`,
      ...rest,
      onClick: () => {
        if (onClick == null) return
        return onClick(feature)
      }
    })
  }
}

type IFeatureLayerProps = React.PropsWithChildren<{
  geometry?: object
  features?: IFeature[]
  useCanvas?: boolean
  [k: string]: any
}>

const FeatureLayer = (props: IFeatureLayerProps) => {
  const { useCanvas, features, geometry, children, ...rest } = props

  let newChildren = null
  if (features != null) {
    newChildren = features.map((feature, i) => h(Feature, { feature, key: i }))
  } else if (geometry != null) {
    newChildren = h(Feature, { feature: { id: 0, geometry } })
  }

  const el = useCanvas ? CanvasLayer : 'g'

  return h(el, rest, [children, newChildren])
}

FeatureLayer.defaultProps = {
  useCanvas: false
}

export { FeatureLayer, Feature }

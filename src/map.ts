import {useState, useContext} from 'react'
import useAsyncEffect from 'use-async-effect'
import h from 'react-hyperscript'
import {APIResultView, APIContext} from '@macrostrat/ui-components'
import {
  Globe,
  CanvasLayer,
  MapContext,
  MapCanvasContext
} from '@macrostrat/map-components'
import {ResizeSensor} from '@blueprintjs/core'
import {min} from 'd3-array'
import {get} from 'axios'
import {feature} from 'topojson'

const FeatureLayer = (props)=>{
  const {useCanvas, ...rest} = props
  if (useCanvas) {
    return h(CanvasLayer, rest)
  }
  return h('g', rest)
}

FeatureLayer.defaultProps = {
  useCanvas: false
}

const Feature = (props)=>{
  const {geometry, ...rest} = props
  const {inCanvas, context} = useContext(MapCanvasContext)

  if (inCanvas) {
    const {renderPath} = useContext(MapCanvasContext)
    if (context != null) {
      renderPath(geometry)
    }
    return null
  } else {
    const {renderPath} = useContext(MapContext)
    const d = renderPath(geometry)
    return h('path', {d, ...rest})
  }
}


const Land = (props)=>{

  const [geometry, setGeometry] = useState(null)

  useAsyncEffect(async function(){
    const {data} = await get("https://unpkg.com/world-atlas@1/world/110m.json")
    // Parse topoJSON
    const geom = feature(data, data.objects.land)
    setGeometry(geom)
  }, [])

  return h(FeatureLayer, {
    useCanvas: true,
    style: {
      fill: 'rgb(233, 252, 234)'
      stroke: 'transparent'
    }
  }, [
    h(Feature, {geometry})
  ])
}

const Columns = (props)=>{
  const {buildURL} = useContext(APIContext).helpers

  const [features, setFeatures] = useState([])

  useAsyncEffect(async function(){
    const uri = buildURL('/columns', {format: 'topojson', all: true})
    const res = await get(uri)
    const {data} = res.data.success
    // Parse topoJSON
    const {features} = feature(data, data.objects.output)
    setFeatures(features)
  }, [])

  return h(FeatureLayer, {
    useCanvas: true,
    style: {
      fill: 'rgba(150,150,150,0.2)'
      stroke: 'rgb(150,150,150,0.4)'
    }
  }, features.map(f =>{
    const {geometry} = f
    return h(Feature, {geometry})
  })
}

const MapView = props =>{
  const [size, setSize] = useState({width: 200, height: 200})

  const onResize = (entries)=>{
    const {width, height} = entries[0].contentRect
    setSize({width, height})
  }

  const {featureDataset, margin} = props
  return h(ResizeSensor, {onResize}, [
    h('div.context-map', [
      h(Globe, {
        ...size,
        margin,
        keepNorthUp: true,
        scale: min([size.width,size.height])/2-(2*margin)
      }, [
        h(Land)
        h(Columns)
      ])
    ])
  ])
}

MapView.defaultProps = {
  margin: 10
}

export default MapView

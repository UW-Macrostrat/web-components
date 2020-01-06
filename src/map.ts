import {useState, useContext} from 'react'
import useAsyncEffect from 'use-async-effect'
import h from 'react-hyperscript'
import {
  APIResultView,
  APIContext,
  useAPIResult
} from '@macrostrat/ui-components'
import {
  Globe,
  CanvasLayer,
  MapContext,
  MapCanvasContext,
  FeatureLayer
} from '@macrostrat/map-components'
import {ResizeSensor} from '@blueprintjs/core'
import {min} from 'd3-array'
import {geoCentroid} from 'd3-geo'
import {get} from 'axios'
import {feature} from 'topojson'

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
    },
    geometry
  }
}

const Columns = (props)=>{

  let features = useAPIResult('/columns', {format: 'topojson', all: true}, res =>{
    const {features} = feature(res, res.objects.output)
    return features
  })
  if (features == null) return null

  return h(FeatureLayer, {
    useCanvas: true,
    style: {
      fill: 'rgba(150,150,150,0.2)'
      stroke: 'rgb(150,150,150,0.4)'
    }
    features
  }
}

const CurrentColumn = props =>{
  const {feature} = props
  console.log(feature)
  return h(FeatureLayer, {
    features: [feature],
    style: {
      fill: 'rgba(255,0,0,0.4)'
      stroke: 'rgba(255,0,0,0.6)'
      strokeWidth: 2
    }
  })
}

const MapView = props =>{
  const {currentColumn} = props
  const [size, setSize] = useState({width: 200, height: 200})

  const onResize = (entries)=>{
    const {width, height} = entries[0].contentRect
    setSize({width, height})
  }

  const columnCenter = geoCentroid?.(currentColumn)

  const {featureDataset, margin} = props
  return h(ResizeSensor, {onResize}, [
    h('div.context-map', [
      h(Globe, {
        ...size,
        margin,
        center: columnCenter
        keepNorthUp: true,
        scale: min([size.width,size.height])/2-(2*margin)
      }, [
        h(Land)
        h(Columns)
        h.if(currentColumn != null)(CurrentColumn, {feature: currentColumn})
      ])
    ])
  ])
}

MapView.defaultProps = {
  margin: 10
}

export default MapView

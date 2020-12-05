import {useState} from 'react'
import useAsyncEffect from 'use-async-effect'
import h from '@macrostrat/hyper'
import {useAPIResult} from '@macrostrat/ui-components'
import {
  FeatureLayer,
  Feature
} from '@macrostrat/map-components'
import {get} from 'axios'
import {feature} from 'topojson-client'

function processTopoJSON(res) {
  try {
    const {data} = res.success
    const {features: f} = feature(data, data.objects.output)
    return f
  } catch (err) {
    console.error(err)
    return []
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
      fill: 'rgb(233, 252, 234)',
      stroke: 'transparent'
    },
    geometry
  })
}

const Columns = (props)=>{

  const {onClick} = props

  let features = useAPIResult('/columns', {format: 'topojson', all: true}, processTopoJSON)
  if (features == null) return null

  return h(FeatureLayer, {
    className: "columns"
    useCanvas: onClick == null,
    style: {
      fill: 'rgba(150,150,150,0.2)'
      stroke: 'rgb(150,150,150,0.4)'
    }
  }, features.map(f =>{
    return h(Feature, {
      onClick,
      feature: f
    })
  })
}

const CurrentColumn = props =>{
  const {feature} = props
  return h(FeatureLayer, {
    features: [feature],
    style: {
      fill: 'rgba(255,0,0,0.4)'
      stroke: 'rgba(255,0,0,0.6)'
      strokeWidth: 2
    }
  })
}

export {Land, Columns, CurrentColumn, processTopoJSON}

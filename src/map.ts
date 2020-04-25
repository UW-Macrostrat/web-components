import {useState} from 'react'
import useAsyncEffect from 'use-async-effect'
import h from '@macrostrat/hyper'
import {useAPIResult} from '@macrostrat/ui-components'
import {
  Globe,
  FeatureLayer,
  Feature
} from '@macrostrat/map-components'
import {Button, ResizeSensor} from '@blueprintjs/core'
import {min} from 'd3-array'
import {geoCentroid} from 'd3-geo'
import {get} from 'axios'
import {feature} from 'topojson-client'

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

  let features = useAPIResult('/columns', {format: 'topojson', all: true}, res =>{
    try {
      const {data} = res.success
      const {features: f} = feature(data, data.objects.output)
      return f
    } catch (err) {
      console.error(err)
      return []
    }
  })
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

const MapView = props =>{
  const {currentColumn, setCurrentColumn} = props
  const [size, setSize] = useState({width: 0, height: 0})
  const [expanded, setExpanded] = useState(false)

  const onResize = (entries)=>{
    const {width, height} = entries[0].contentRect
    setSize({width, height})
  }

  const columnCenter = geoCentroid?.(currentColumn)

  const className = expanded ? "expanded" : null
  const {margin} = props
  let scale = min([size.width,size.height])/2-(margin)
  if (expanded) {
    scale *= 3
  }

  const clicker = (shouldExpand: boolean) => => {
    setExpanded(shouldExpand)
  }

  const onClick = expanded ? setCurrentColumn : null

  return h(ResizeSensor, {onResize}, [
    h('div.context-map', {className}, [
      h(Globe, {
        ...size,
        margin,
        center: columnCenter
        allowDrag: expanded,
        allowZoom: false
        keepNorthUp: true,
        scale
        onClick: clicker(true)
      }, [
        h(Land)
        h(Columns, {onClick})
        h.if(currentColumn != null)(CurrentColumn, {feature: currentColumn})
      ]),
      h.if(expanded)(Button, {
        className: 'close-button',
        icon: 'cross',
        minimal: true,
        onClick: clicker(false)
        intent: 'danger'
      })
    ])
  ])
}

MapView.defaultProps = {
  margin: 10
}

export default MapView

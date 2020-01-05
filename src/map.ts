import {useState, useContext} from 'react'
import useAsyncEffect from 'use-async-effect'
import h from 'react-hyperscript'
import {APIResultView} from '@macrostrat/ui-components'
import {Globe, CanvasLayer} from '@macrostrat/map-components'
import {ResizeSensor} from '@blueprintjs/core'
import {min} from 'd3-array'
import {get} from 'axios'

/*
const Land = (props)=>{
  const renderResult = (data)=>{
    console.log(data);
    const {land} = data.objects
    return h(CanvasLayer, {geometry: land, fill: 'rgb(233, 252, 234)'})
  }
  return h(APIResultView, {
    route: "https://unpkg.com/world-atlas@1/world/50m.json",
    placeholder: null,
    unwrapResponse: res => res.data.objects.land
  }, renderResult)
}
*/

const Land = (props)=>{

  const [geometry, setGeometry] = useState(null)

  useAsyncEffect(async function(){
    const {data} = await get("https://unpkg.com/world-atlas@1/world/50m.json")
    setGeometry(data.objects.land)
  }, [])

  return h(CanvasLayer, {geometry, fill: 'rgb(233, 252, 234)'})
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
      ])
    ])
  ])
}

MapView.defaultProps = {
  margin: 10
}

export default MapView

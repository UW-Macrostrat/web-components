import {useState, useContext} from 'react'
import h from 'react-hyperscript'
import {Globe} from '@macrostrat/map-components'
import {ResizeSensor} from '@blueprintjs/core'
import {max} from 'd3-array'

const MapView = props =>{
  const [size, setSize] = useState({width: 1100, height: 800})

  const onResize = (entries)=>{
    const {width, height} = entries[0].contentRect
    setSize({width, height})
  }

  const {featureDataset, margin} = props
  return h(ResizeSensor, {onResize}, [
    h('div.world-map', [
      h(Globe, {
        ...size,
        margin,
        keepNorthUp: true,
        scale: max([size.width,size.height])/2-(2*margin)
      }, [
      ])
    ])
  ])
}

MapView.defaultProps = {
  margin: 10
}

export default MapView

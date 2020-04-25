import {useState} from 'react'
import h from '@macrostrat/hyper'
import {Globe} from '@macrostrat/map-components'
import {Button, ResizeSensor} from '@blueprintjs/core'
import {min} from 'd3-array'
import {geoCentroid} from 'd3-geo'
import {Land, Columns, CurrentColumn} from './layers'

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

  const clicker = (shouldExpand: boolean) => ()=> {
    setExpanded(shouldExpand)
  }

  const onClick = expanded ? setCurrentColumn : null

  return h(ResizeSensor, {onResize}, [
    h('div.context-map', {className}, [
      h(Globe, {
        ...size,
        margin,
        center: columnCenter,
        allowDrag: expanded,
        allowZoom: false,
        keepNorthUp: true,
        scale,
        onClick: clicker(true)
      }, [
        h(Land),
        h(Columns, {onClick}),
        h.if(currentColumn != null)(CurrentColumn, {feature: currentColumn})
      ]),
      h.if(expanded)(Button, {
        className: 'close-button',
        icon: 'cross',
        minimal: true,
        onClick: clicker(false),
        intent: 'danger'
      })
    ])
  ])
}

MapView.defaultProps = {
  margin: 10
}

export default MapView

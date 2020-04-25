import {useState} from 'react'
import h from '@macrostrat/hyper'
import {Globe} from '@macrostrat/map-components'
import {Button} from '@blueprintjs/core'
import {geoCentroid} from 'd3-geo'
import {Land, Columns, CurrentColumn} from './layers'
import classNames from 'classnames'
import {useSpring, animated} from 'react-spring'

const MapView = props =>{
  const {currentColumn, setCurrentColumn} = props
  const [expanded, setExpanded] = useState(false)

  const columnCenter = geoCentroid?.(currentColumn)

  const className = classNames({expanded}, 'context-map')
  const {margin} = props


  const clicker = (shouldExpand: boolean) => ()=> {
    setExpanded(shouldExpand)
  }

  const baseSize = 250
  const sz = expanded ? 450 : baseSize

  let scale = sz/2-(margin)
  if (expanded) {
    scale *= 3
  }

  const animationProps = useSpring({
    width: sz,
    height: sz,
    scale,
  })

  return h("div.map-placeholder", {style: {width: baseSize, height: baseSize}}, [
    h(animated.div, {className, style: animationProps}, [
      h(Globe, {
        scale,
        width: sz,
        height: sz,
        margin,
        center: columnCenter,
        allowDrag: expanded,
        allowZoom: false,
        keepNorthUp: true,
        onClick: clicker(true)
      }, [
        h(Land),
        h(Columns, {onClick: setCurrentColumn}),
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

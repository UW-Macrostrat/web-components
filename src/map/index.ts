import {useState} from 'react'
import h from '@macrostrat/hyper'
import {Globe} from '@macrostrat/map-components'
import {Button} from '@blueprintjs/core'
import {geoCentroid} from 'd3-geo'
import {Land, Columns, CurrentColumn} from './layers'
import classNames from 'classnames'
import {useSpring, animated} from 'react-spring'

const AnimatedGlobe = animated(Globe)

const MapView = props =>{
  const {currentColumn, setCurrentColumn} = props
  const [expanded, setExpanded] = useState(false)

  const columnCenter = geoCentroid?.(currentColumn)

  const className = classNames({expanded}, 'context-map')
  const {margin} = props

  const baseSize = 250
  const sz = expanded ? 450 : baseSize

  let scale = sz/2-(margin)
  if (expanded) {
    scale *= 3
  }

  const targetProps = {
    width: sz,
    height: sz,
    scale,
  }

  const animationProps = useSpring(targetProps)

  return h("div.map-placeholder", {style: {width: baseSize, height: baseSize}}, [
    h(animated.div, {className, style: animationProps}, [
      h(AnimatedGlobe, {
        ...targetProps,
        margin,
        center: columnCenter,
        allowDrag: expanded,
        allowZoom: false,
        keepNorthUp: true,
        onClick() {
          setExpanded(true)
        }
      }, [
        h(Land),
        h(Columns, {onClick: setCurrentColumn}),
        h.if(currentColumn != null)(CurrentColumn, {feature: currentColumn})
      ]),
      h.if(expanded)(Button, {
        className: 'close-button',
        icon: 'cross',
        minimal: true,
        onClick() {
          setExpanded(false)
        },
        intent: 'danger'
      })
    ])
  ])
}

MapView.defaultProps = {
  margin: 10
}

export default MapView

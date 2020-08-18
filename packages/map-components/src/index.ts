import React, { Component, useContext, createRef, createElement } from 'react'
import { findDOMNode } from 'react-dom'
import { addClassNames } from '@macrostrat/hyper'
import { StatefulComponent } from '@macrostrat/ui-components'
import T from 'prop-types'
import h from './hyper'
import { MapContext } from './context'
import { DraggableOverlay } from './drag-interaction'
import { min, max } from 'd3-array'
import { geoOrthographic, geoGraticule, geoPath } from 'd3-geo'
import styles from './main.module.styl'

function GeoPath(props) {
  const { geometry, ...rest } = props
  const { renderPath } = useContext<any>(MapContext)
  const d = geometry != null ? renderPath(geometry) : null
  return h('path', { d, ...rest })
}

class Background extends Component {
  static contextType = MapContext
  render() {
    return h(GeoPath, {
      geometry: { type: 'Sphere' },
      className: 'background',
      ...this.props
    })
  }
}

const Graticule = function(props) {
  const graticule = geoGraticule()
    .step([10, 10])
    .extent([
      [-180, -80],
      [180, 80 + 1e-6]
    ])
  return h(GeoPath, {
    className: 'graticule',
    geometry: graticule(),
    ...props
  })
}

const Sphere = function(props) {
  const newProps = addClassNames(props, 'neatline')
  return h(GeoPath, {
    geometry: { type: 'Sphere' },
    ...newProps
  })
}

class Globe extends StatefulComponent<any, any> {
  static propTypes = {
    projection: T.func.isRequired,
    width: T.number.isRequired,
    height: T.number.isRequired,
    keepNorthUp: T.bool,
    allowDrag: T.bool,
    allowZoom: T.bool,
    setupProjection: T.func,
    scale: T.number,
    center: T.arrayOf(T.number),
    translate: T.arrayOf(T.number)
  }
  static defaultProps = {
    keepNorthUp: false,
    allowDrag: true,
    allowZoom: false,
    center: [0, 0],
    projection: geoOrthographic()
      .clipAngle(90)
      .precision(0.5),
    setupProjection(projection, { width, height, scale, translate, center, margin }) {
      if (scale == null) {
        const maxSize = min([width, height])
        scale = maxSize / 2
      }
      if (translate == null) {
        translate = [width / 2, height / 2]
      }
      return projection
        .scale(scale)
        .translate(translate)
        .rotate([-center[0], -center[1]])
        .clipExtent([
          [margin, margin],
          [width - margin, height - margin]
        ])
    }
  }

  mapElement: React.RefObject<HTMLElement>

  constructor(props) {
    super(props)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
    this.updateProjection = this.updateProjection.bind(this)
    this.rotateProjection = this.rotateProjection.bind(this)
    this.dispatchEvent = this.dispatchEvent.bind(this)
    this.componentDidMount = this.componentDidMount.bind(this)

    this.mapElement = createRef()

    const { projection } = this.props
    projection.center([0, 0])

    this.state = {
      projection,
      zoom: 1,
      canvasContexts: new Set([])
    }
  }

  componentDidUpdate(prevProps) {
    let projection
    const { width, height, scale, translate, center, margin, setupProjection } = this.props
    const sameDimensions = prevProps.width === width && prevProps.height === height
    const sameProjection = prevProps.projection === this.props.projection
    const sameScale =
      prevProps.scale === scale && prevProps.translate === translate && prevProps.center === center
    if (sameDimensions && sameProjection && sameScale) {
      return
    }
    if (sameProjection) {
      ;({ projection } = this.state)
    } else {
      ;({ projection } = this.props)
    }

    const newProj = setupProjection(projection, { width, height, scale, translate, center, margin })

    return this.updateProjection(newProj)
  }

  updateProjection(newProj) {
    return this.updateState({ projection: { $set: newProj } })
  }

  rotateProjection(rotation) {
    return this.updateProjection(this.state.projection.rotate(rotation))
  }

  dispatchEvent(evt) {
    const v = <HTMLElement>findDOMNode(this)
    const el = v.getElementsByClassName(styles.map)[0]
    // Simulate an event directly on the map's DOM element
    const { clientX, clientY } = evt

    const e1 = new Event('mousedown', <any>{ clientX, clientY })
    const e2 = new Event('mouseup', <any>{ clientX, clientY })

    el.dispatchEvent(e1)
    return el.dispatchEvent(e2)
  }

  componentDidMount() {
    return this.componentDidUpdate.call(this, arguments)
  }

  render() {
    let {
      width,
      height,
      children,
      keepNorthUp,
      allowDrag,
      allowZoom,
      scale,
      center,
      graticule,
      ...rest
    } = this.props
    const { projection } = this.state
    const initialScale = scale || projection.scale() || 500

    if (graticule == null) {
      graticule = Graticule
    }

    const actions = (() => {
      let dispatchEvent, rotateProjection, updateProjection, updateState
      return ({ updateState, updateProjection, dispatchEvent, rotateProjection } = this)
    })()
    const renderPath = geoPath(projection)
    const value = { projection, renderPath, width, height, ...actions }

    const xmlns = 'http://www.w3.org/2000/svg'
    const viewBox = `0 0 ${width} ${height}`

    return h(MapContext.Provider, { value }, [
      createElement(
        'svg',
        {
          className: 'macrostrat-map globe',
          xmlns,
          width,
          height,
          viewBox,
          ...rest
        },
        [
          h('g.map', { ref: this.mapElement }, [
            h(Background, { fill: 'dodgerblue' }),
            h.if(graticule)(graticule),
            children,
            h(Sphere)
          ]),
          h.if(allowDrag)(DraggableOverlay, {
            keepNorthUp,
            initialScale,
            dragSensitivity: 0.1,
            allowZoom
          })
        ]
      )
    ])
  }
}

export { Globe, MapContext }
export * from './canvas-layer'
export * from './feature'

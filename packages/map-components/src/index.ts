import React, { Component, useContext, createRef, createElement } from 'react'
import { findDOMNode } from 'react-dom'
import { addClassNames } from '@macrostrat/hyper'
import { StatefulComponent } from '@macrostrat/ui-components'
import h from './hyper'
import { MapContext } from './context'
import { DraggableOverlay } from './drag-interaction'
import { min, max } from 'd3-array'
import { geoOrthographic, geoGraticule, geoPath, GeoProjection } from 'd3-geo'
import styles from './main.module.styl'

type Coord = [number, number]

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

function Sphere(props) {
  const newProps = addClassNames(props, 'neatline')
  return h(GeoPath, {
    geometry: { type: 'Sphere' },
    ...newProps
  })
}

interface ProjectionParams {
  center?: Coord
  translate?: Coord
  width: number
  height: number
  scale: number
  margin: number
}

type MutateProjection = (p: GeoProjection, opts: ProjectionParams) => GeoProjection

interface GlobeProps extends ProjectionParams {
  [key: string]: any
  projection: GeoProjection
  setCenter?(v: Coord): void
  keepNorthUp: boolean
  allowDrag: boolean
  allowZoom: boolean
  setupProjection: MutateProjection
}

const mutateProjection: MutateProjection = (projection, opts) => {
  /** Function to update a projection with new parameters */
  const { width, height, center } = opts
  const margin = opts.margin ?? 0
  let { scale, translate } = opts
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
    .center(center)
    .clipExtent([
      [margin, margin],
      [width - margin, height - margin]
    ])
}

class Globe extends StatefulComponent<GlobeProps, any> {
  static defaultProps = {
    keepNorthUp: false,
    allowDrag: true,
    allowZoom: false,
    center: [0, 0],
    graticule: Graticule,
    projection: geoOrthographic()
      .clipAngle(90)
      .precision(0.5),
    setupProjection: mutateProjection
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

    this.state = {
      projection,
      zoom: 1,
      canvasContexts: new Set([])
    }
  }

  componentDidUpdate(prevProps) {
    const { width, height, scale, translate, center, margin, setupProjection } = this.props
    const sameDimensions = prevProps.width === width && prevProps.height === height
    const sameProjection = prevProps.projection === this.props.projection
    const sameScale =
      prevProps.scale === scale && prevProps.translate === translate && prevProps.center === center
    if (sameDimensions && sameProjection && sameScale) {
      return
    }

    const projection = sameProjection ? this.state.projection : this.props.projection

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
      graticule
    } = this.props
    const { projection } = this.state
    const initialScale = scale || projection.scale() || 500

    const actions = (() => {
      let dispatchEvent, rotateProjection, updateProjection, updateState
      return ({ updateState, updateProjection, dispatchEvent, rotateProjection } = this)
    })()

    const renderPath = geoPath(projection)
    const value = { projection, renderPath, width, height, ...actions }

    const margin = 80

    const xmlns = 'http://www.w3.org/2000/svg'
    const viewBox = `0 0 ${width} ${height}`

    return h(
      MapContext.Provider,
      { value },
      createElement(
        'svg',
        {
          className: 'macrostrat-map globe',
          xmlns,
          width,
          height,
          viewBox
        },
        [
          h('g.map', { ref: this.mapElement }, [
            h(Background, { fill: 'dodgerblue' }),
            h(graticule),
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
    )
  }
}

export { Globe, MapContext }
export * from './canvas-layer'
export * from './feature'

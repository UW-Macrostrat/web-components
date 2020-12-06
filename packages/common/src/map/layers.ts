import { useState } from 'react'
import useAsyncEffect from 'use-async-effect'
import h from '@macrostrat/hyper'
import { useAPIResult } from '@macrostrat/ui-components'
import {
  FeatureLayer,
  Feature
} from '@macrostrat/map-components'
import { get } from 'axios'
import { feature } from 'topojson-client'
import { geoVoronoi } from 'd3-geo-voronoi'
import { geoCentroid } from "d3-geo"

function processTopoJSON(res) {
  try {
    const { data } = res.success
    const { features: f } = feature(data, data.objects.output)
    return f
  } catch (err) {
    console.error(err)
    return []
  }
}

const Land = (props) => {
  const [geometry, setGeometry] = useState(null)
  useAsyncEffect(async function() {
    const { data } = await get("https://unpkg.com/world-atlas@1/world/110m.json")
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

function ColumnFeatures(props) {
  const { features, onClick } = props
  return h(FeatureLayer, {
      className: "columns",
      useCanvas: onClick == null,
      style: {
        fill: 'rgba(150,150,150,0.2)',
        stroke: 'rgb(150,150,150,0.4)'
      }
    }, features.map(f => {
      return h(Feature, {
        onClick,
        feature: f
      })
    })
  })
}

interface ColumnNavProps {
  col_id: number;
  onChange(col_id: number): void;
}

interface KeyboardNavProps extends ColumnNavProps {
  features: any[];
  showLayers: boolean;
}


function ColumnKeyboardNavigation(props: KeyboardNavProps) {
  /**
  Feature to enable keyboard navigation of columns using a
  delaunay triangulation
  */
  const { features, col_id, onChange, showLayers = false } = props
  const centroids = features.map(geoCentroid)
  const currentIndex = features.findIndex(d => d.properties.col_id == col_id)


  const tri = geoVoronoi(centroids)
  console.log(features, tri.delaunay)

  const neighbors = tri.delaunay.neighbors[currentIndex]
  console.log(neighbors)

  const neighborFeatures = neighbors.map(d => features[d])

  return h([
    h(FeatureLayer, {
      features: tri.links().features, useCanvas: false, style: {
        stroke: "purple",
        fill: "transparent"
      }
    }),
    h(FeatureLayer, {
      features: neighborFeatures, useCanvas: false, style: {
        stroke: "rgb(93, 101, 212)",
        strokeWidth: 3,
        fill: "rgba(93, 101, 212, 0.5)"
      }
    }),

    //h(FeatureLayer, {features: tri.centers, useCanvas: false})
  ])
}

const Columns = (props: ColumnNavProps) => {

  const { onChange, col_id } = props

  let features = useAPIResult('/columns', { format: 'topojson', all: true }, processTopoJSON)
  if (features == null) return null

  return h([
    h(ColumnKeyboardNavigation, { features, col_id, onChange }),
    h(ColumnFeatures, { features, onClick: onChange })
  ])
}

const CurrentColumn = props => {
  const { feature } = props
  return h(FeatureLayer, {
    features: [feature],
    style: {
      fill: 'rgba(255,0,0,0.4)',
      stroke: 'rgba(255,0,0,0.6)',
      strokeWidth: 2
    }
  })
}

export { Land, Columns, CurrentColumn, processTopoJSON }

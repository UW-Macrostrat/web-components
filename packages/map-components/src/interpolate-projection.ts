import { geoProjection } from 'd3-geo'
/*
https://bl.ocks.org/rob4acre/50c94f7ee7e96c40434bfa313c37576d
Function to interpolate two projections

Updated version here:
https://observablehq.com/@jashkenas/interpolating-d3-map-projections

NOTE: this code is currently non-functional and is here as a placeholder!
*/

function interpolatedProjection(a, b) {
  var projection = geoProjection(raw).scale(1),
    center = projection.center,
    translate = projection.translate,
    α

  function raw(λ, φ) {
    var pa = a([(λ *= 180 / Math.PI), (φ *= 180 / Math.PI)]),
      pb = b([λ, φ])
    return [(1 - α) * pa[0] + α * pb[0], (α - 1) * pa[1] - α * pb[1]]
  }

  projection.alpha = function(_) {
    if (!arguments.length) return α
    α = +_
    var ca = a.center(),
      cb = b.center(),
      ta = a.translate(),
      tb = b.translate()
    center([(1 - α) * ca[0] + α * cb[0], (1 - α) * ca[1] + α * cb[1]])
    translate([(1 - α) * ta[0] + α * tb[0], (1 - α) * ta[1] + α * tb[1]])
    return projection
  }

  delete projection.scale
  delete projection.translate
  delete projection.center
  return projection.alpha(0)
}

export { interpolatedProjection }

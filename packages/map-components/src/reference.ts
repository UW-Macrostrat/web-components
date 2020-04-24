/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
D3 world map taken from my website
*/

class WorldMap {
  constructor({ el, projection }) {
    this.redraw = this.redraw.bind(this)
    this.el = el
    this.projection = projection

    const graticule = d3
      .geoGraticule()
      .step([10, 10])
      .extent([
        [-180, -80],
        [180, 80 + 1e-6]
      ])

    this.path = d3.geoPath().projection(this.projection)

    const x = window.innerWidth
    const y = window.innerHeight

    const node = this.el.node()
    const { width, height } = node.getBoundingClientRect()

    this.svg = d3
      .select(node)
      .append('svg')
      .attr('class', 'map')
      .attr('width', width)
      .attr('height', height)

    this.data = {
      globe: { type: 'Sphere' },
      graticule
    }

    this.globe = this.svg.append('g')
  }

  addData(data, v) {
    if (v == null) {
      v = 'normal'
    }
    this.data[v] = {
      land: topojson.feature(data, data.objects.land),
      lakes: topojson.feature(data, data.objects.lakes)
    }

    return this.updateView(v)
  }

  updateView(v) {
    if (v == null) {
      v = 'normal'
    }
    const addPath = (datum, cls) => {
      return this.globe
        .append('path')
        .datum(datum)
        .attr('class', cls)
        .attr('d', this.path)
    }

    this.globe.selectAll('*').remove()

    addPath(this.data.globe, 'water')
    addPath(this.data.graticule, 'graticule')
    addPath(this.data[v].land, 'land')
    addPath(this.data[v].lakes, 'water')

    return this.redraw()
  }

  redraw() {
    this.svg.selectAll('path').attr('d', this.path)

    const p = this.projection
    return this.svg.selectAll('circle').each(function(d) {
      const c = p(d.geometry.coordinates)
      return d3
        .select(this)
        .attr('cx', c[0])
        .attr('cy', c[1])
    })
  }
}

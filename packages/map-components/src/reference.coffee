###
D3 world map taken from my website
###

class WorldMap
  constructor: ({el, projection})->
    @el = el
    @projection = projection

    graticule = d3.geoGraticule()
      .step [10,10]
      .extent [
          [-180,-80]
          [180,80 + 1e-6]
        ]

    @path = d3.geoPath()
      .projection(@projection)

    x = window.innerWidth
    y = window.innerHeight

    node = @el.node()
    {width, height} = node.getBoundingClientRect()

    @svg = d3.select(node)
      .append("svg")
        .attr 'class', 'map'
        .attr 'width', width
        .attr 'height', height

    @data =
      globe: {type: "Sphere"}
      graticule: graticule

    @globe = @svg.append "g"

  addData: (data, v="normal")->
    @data[v] =
      land: topojson.feature data, data.objects.land
      lakes: topojson.feature data, data.objects.lakes

    @updateView v

  updateView: (v="normal")->

    addPath = (datum, cls)=>
      @globe.append "path"
        .datum datum
        .attr 'class', cls
        .attr 'd', @path

    @globe.selectAll("*").remove()

    addPath @data.globe, "water"
    addPath @data.graticule, "graticule"
    addPath @data[v].land, "land"
    addPath @data[v].lakes, "water"

    @redraw()

  redraw: =>
    @svg.selectAll "path"
      .attr "d", @path

    p = @projection
    @svg.selectAll "circle"
      .each (d)->
        c = p d.geometry.coordinates
        d3.select @
          .attr 'cx', c[0]
          .attr 'cy', c[1]

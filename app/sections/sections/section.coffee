d3 = require 'd3'
require 'd3-selection-multi'

dataDir = process.env.NAUKLUFT_DATA_DIR

Query = require '../database'

getRect = (el)->
  el.node().getBoundingClientRect()

class Section
  #Pixels per meter of measured section
  pixelScale: 10
  padding: 40
  fence: true
  constructor: (@el,@opts)->
    @opts.height = @opts.range[1]-@opts.range[0]

    desc = @el.append 'div'
      .styles 'padding-left': "#{@padding-4}px"

    desc.append 'h2'
      .text @opts.name

    desc.append 'h4'
      .attrs class: 'location'
      .text @opts.location

    @main = @el.append 'div'
      .attrs class: 'main'

    @backdrop = @main.append 'svg'
      .attrs class: 'backdrop'
      .append 'g'
        .attrs transform: "translate(#{@padding},10)"

    n = @opts.name
    @img = @main.append 'img'
      .attrs
        src: "#{dataDir}/Sections/section-images/#{n}.png"
        alt: n
      .on 'load', @finalize

    @overlay = @main.append 'svg'
      .attrs class: 'overlay'
      .append 'g'
        .attrs transform: "translate(#{@padding},10)"

  finalize: =>
    imHeight = @img.node().naturalHeight
    im = getRect @img
    # Natural pixel scale of image
    m_per_pixel = imHeight/(@opts.height*@pixelScale)

    @img.attrs height: imHeight/m_per_pixel
    @img.attrs width: @img.node().naturalWidth/3

    height = getRect(@img).height
    width = getRect(@main).width-2*@padding

    @y = d3.scaleLinear()
      .domain(@opts.range)
      .range([height,0])

    yAxis = d3.axisLeft()
      .scale(@y)
      .ticks(@opts.height//10)

    @backdrop.append 'g'
      .attrs class: 'y axis'
      .call yAxis
      .selectAll '.tick line'
        .attrs
          x1: -6
          x2: width
          stroke: '#ccc'
          'stroke-width': 2

    # Offset sections into fence diagram
    if @fence
      @el.styles
        'align-self': 'flex-end'
      @main.styles
        'padding-bottom': "#{@opts.offset*@pixelScale}px"
    @lithologyIntervals()

  lithologyIntervals: (d)=>
    sql = "SELECT
        s.*,
        t.tree
      FROM
        section.section_lithology s
        JOIN section.lithology_tree t ON s.lithology = t.id
      WHERE section = $1::text
      ORDER BY bottom"
    Query sql,[@opts.id]
      .then @drawLithology

  drawLithology: (res)=>
    rawData = res.rows.map (d)->
      d.bottom = parseFloat(d.bottom)
      return d
    totalHeight = @opts.range[1]
    data = rawData.map (d,i)=>
      next = rawData[i+1]
      if next?
        d.top = next.bottom
      else
        d.top = totalHeight
      return d

    g = @overlay.append "g"
      .attrs class: 'lithology'

    sel = g.selectAll 'rect'
      .data data

    sel.enter()
      .append 'rect'
      .attrs
        x: 0
        y: (d)=>@y(d.top)
        width: 30
        height: (d)=>
          # Abs covers up for our lack of
          # reasonable SQL use for now
          Math.abs @y(d.bottom)-@y(d.top)
        fill: (d)->
          i = d.tree[0]
          if i == 'clastic'
            return '#aaaaaa'
          if i == 'carbonate'
            return 'dodgerblue'
          else
            return '#aaaaaa'

module.exports = Section

import {Component} from 'react'
import {findDOMNode} from 'react-dom'
import h from 'react-hyperscript'

class ConfinedImage extends Component
  constructor: (props)->
    super props
    @state = {imageSize: null}

  render: ->
    {maxHeight, maxWidth, src} = @props
    {imageSize} = @state
    maxHeight ?= 200
    maxWidth ?= 200
    if imageSize?
      if maxHeight > imageSize.height
        maxHeight = imageSize.height
      if maxWidth > imageSize.width
        maxWidth = imageSize.width


    imgStyle = {
      maxHeight
      maxWidth
    }

    style = {maxHeight, maxWidth}
    h 'div.image-container', {style}, [
      h 'img', {src, style: imgStyle}
    ]

  componentDidMount: ->
    el = findDOMNode(@)
    img = el.querySelector('img')
    img.onload = =>
      height = img.naturalHeight/2
      width = img.naturalWidth/2
      @setState {imageSize: {height, width}}

export {ConfinedImage}

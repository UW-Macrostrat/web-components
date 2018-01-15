{Component} = require 'react'
{Dialog} = require '@blueprintjs/core'
Slider = require('react-image-slider').default
h = require 'react-hyperscript'

{db, storedProcedure, query} = require '../../db'
require 'react-image-slider/lib/image-slider.css'

__photo_promise = null
__photos = []

getData = ->
  __photo_promise ?= query 'photo'
  if __photos.length == 0
    __photos = await __photo_promise
  return __photos

class PhotoOverlay extends Component
  constructor: (props)->
    super props
    @state = {
      photos: null
      activeImage: null
    }
    getData()
      .then @setPhotos

  setPhotos: (allPhotos)=>
    {photoIDs} = @props
    photos = photoIDs.map (id)=>
      allPhotos.find (d)->d.id == id
    @setState {photos}

  render: ->
    {photos} = @state
    return null if not photos?
    {isOpen, onClose} = @props
    console.log "Rendering"
    console.log photos

    h Dialog, {
      className: 'photo-dialog'
      isOpen, onClose}, [
        h 'div.pt-dialog-body', [
          h Slider, {
              visibleItems: 1
              images: photos.map (d)->d.path
            }, photos.map (d)->
              style = {maxWidth: '100%'}
              key = d.id
              h 'img', {src: d.path, style, key}
        ]
      ]

module.exports = {PhotoOverlay}

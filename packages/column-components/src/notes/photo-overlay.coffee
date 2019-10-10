import {Component} from "react"
import {Dialog} from "@blueprintjs/core"
import h from "react-hyperscript"
import {PlatformContext} from "app/platform"
Lightbox = require('react-images').default

import "react-image-slider/lib/image-slider.css"

__photo_promise = null
__photos = []

getData = ->
  __photo_promise ?= query 'photo'
  if __photos.length == 0
    __photos = await __photo_promise
  return __photos

class PhotoOverlay__ extends Component
  constructor: (props)->
    super props
    @state = {
      photos: null
      currentImage: 0
    }
    getData()
      .then @setPhotos

  setPhotos: (allPhotos)=>
    {photoIDs} = @props
    photos = photoIDs.map (id)=>
      allPhotos.find (d)->d.id == id
    @setState {photos}

  render: ->
    {photos, currentImage} = @state
    return null if not photos?
    {isOpen, onClose, computePhotoPath} = @props

    images = photos.map (d)->
      src = computePhotoPath(d)
      {src, caption: d.note}

    h Lightbox, {
      images
      currentImage
      onClickPrev: @gotoPrev
      onClickNext: @gotoNext
      isOpen, onClose
    }

  gotoPrev: =>
    {currentImage} = @state
    currentImage -= 1
    if currentImage < 0
      currentImage = @state.photos.length
    @setState {currentImage}
  gotoNext: =>
    {currentImage} = @state
    currentImage += 1
    if currentImage >= @state.photos.length
      currentImage = 0
    @setState {currentImage}

class PhotoOverlay extends Component
  render: ->
    h PlatformContext.Consumer, null, ({computePhotoPath})=>
      h PhotoOverlay__, {computePhotoPath, @props...}

export {PhotoOverlay}

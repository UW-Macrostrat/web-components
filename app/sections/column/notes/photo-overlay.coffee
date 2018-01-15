{Component} = require 'react'
{Dialog} = require '@blueprintjs/core'
h = require 'react-hyperscript'
{db, storedProcedure, query} = require '../../db'

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
    }
    getData()
      .then @setPhotos

  setPhotos: (allPhotos)=>
    {photoIDs} = @props
    photos = photoIDs.map (id)=>
      allPhotos.find (d)->d.id = id
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
          h 'ul', photos.map (d)->
            console.log d
            h 'li', d.path
        ]
      ]

module.exports = {PhotoOverlay}

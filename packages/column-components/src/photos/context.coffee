import {Component, createContext} from "react"
import T from 'prop-types'
import h from '@macrostrat/hyper'

# Default value for computePhotoPath
computePhotoPath = (src)->src

PhotoLibraryContext = createContext {
  photos: null
  computePhotoPath
}

PhotoShape = T.shape {
  src: T.string.isRequired
  caption: T.string
}

class PhotoLibraryProvider extends Component
  @propTypes: {
    photos: T.arrayOf(PhotoShape)
    computePhotoPath: T.func
  }
  @defaultProps: {
    computePhotoPath
  }
  render: ->
    {children, rest...} = @props
    h PhotoLibraryContext.Provider, {value: rest, children}

export {PhotoLibraryProvider, PhotoLibraryContext}

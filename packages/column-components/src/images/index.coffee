import h from '../hyper'
import {Component} from 'react'
import {ColumnContext} from '../context'

class ColumnImage extends Component
  @contextType: ColumnContext
  render: ->
    {src, rest...} = @props
    {pixelHeight} = @context
    h 'div.column-image', {style: rest}, [
      h 'img', {src, style: {height: pixelHeight}}
    ]

export * from './images'
export {ColumnImage}

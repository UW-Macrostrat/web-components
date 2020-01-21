import {Component} from 'react'
import h from './hyper'
import {ColumnContext} from './context'

class ColumnImage extends Component
  @contextType: ColumnContext
  render: ->
    {src, rest...} = @props
    {pixelHeight} = @context
    h 'div.column-image', {style: rest}, [
      h 'img', {src, style: {height: pixelHeight}}
    ]

export {ColumnImage}

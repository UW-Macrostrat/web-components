import h from 'react-hyperscript'
import {useContext} from 'react'
import {ColumnContext} from '../context'
import classNames from 'classnames'
import Box from 'ui-box'

# This could be merged with ColumnSVG
ColumnBox = (props)->
  {offsetTop, absolutePosition, className, rest...} = props
  {pixelsPerMeter, zoom} = useContext(ColumnContext)

  marginTop = offsetTop*pixelsPerMeter*zoom
  pos = {marginTop}
  if absolutePosition
    pos = {
      position: 'absolute'
      top: marginTop
    }

  h Box, {
    className: classNames('column-box', className)
    pos...
    rest...
  }

export {ColumnBox}

import {Component, createRef} from 'react'
import {findDOMNode} from 'react-dom'
import { animateScroll, scroller, Element } from 'react-scroll'
import Box from 'ui-box'
import T from 'prop-types'
import h from '@macrostrat/hyper'

import {ColumnContext} from '../context'

splitProps = (keys, props)->
  obj = {}
  rest = {}
  for k,v of props
    if keys.includes(k)
      obj[k] = v
    else
      rest[k] = v
  return [obj, rest]

class ColumnScroller extends Component
  @contextType: ColumnContext
  @propTypes: {
    scrollToHeight: T.number
    alignment: T.oneOf(['center', 'top', 'bottom'])
    animated: T.bool
    onScrolled: T.func
    paddingTop: T.number
    scrollContainer: T.func.isRequired
  }
  @defaultProps: {
    animated: true
    alignment: 'center'
    onScrolled: (height)->
      console.log "Scrolled to #{height} m"
    scrollContainer: ->
      document.querySelector('.panel-container')
  }
  render: ->
    keys = Object.keys(@constructor.propTypes)
    [props, rest] = splitProps(keys, @props)
    {pixelHeight} = @context
    h Box, {
      height: pixelHeight,
      position: 'absolute'
      rest...
    }

  scrollTo: (height, opts={})=>
    node = findDOMNode(@)
    {animated, alignment, rest...} = opts
    animated ?= false
    {paddingTop} = @props
    {scale} = @context
    pixelOffset = scale(height)
    {top} = node.getBoundingClientRect()

    node = @props.scrollContainer()
    pos = pixelOffset+top+paddingTop
    screenHeight = window.innerHeight

    if @props.alignment == 'center'
      pos -= screenHeight/2
    else if @props.alignment == 'bottom'
      pos -= screenHeight

    node.scrollTop = pos

  componentDidMount: ->
    {scrollToHeight, alignment} = @props
    return unless scrollToHeight?
    @scrollTo(scrollToHeight, {alignment, animated: false})
    @props.onScrolled(scrollToHeight)

  componentDidUpdate: (prevProps)->
    {scrollToHeight, animated, alignment} = @props
    return unless scrollToHeight?
    return if prevProps.scrollToHeight == scrollToHeight
    @scrollTo(scrollToHeight, {alignment, animated})
    @props.onScrolled(scrollToHeight)

export {ColumnScroller}

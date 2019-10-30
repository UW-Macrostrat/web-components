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
  }
  @defaultProps: {
    animated: true
    alignment: 'center'
    onScrolled: (height)->
      console.log "Scrolled to #{height} m"
  }
  constructor: (props)->
    super props

  render: ->
    setRef = (ref)=> @node=ref
    keys = Object.keys(@constructor.propTypes)
    [props, rest] = splitProps(keys, @props)
    {pixelHeight} = @context

    h Box, {height: pixelHeight, rest...}

  scrollTo: (height, opts={})=>
    node = findDOMNode(@)
    {animated, alignment, rest...} = opts
    animated ?= false
    {scale} = @context
    pixelOffset = scale(height)
    {top} = node.getBoundingClientRect()
    pixelHeight = top+pixelOffset
    console.log(pixelHeight)
    scroller.scrollTo(parseInt(pixelHeight), rest)

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

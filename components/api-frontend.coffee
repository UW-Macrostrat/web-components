import {Component} from 'react'
import h from 'react-hyperscript'
import {get} from 'axios'
import {Spinner, Button, ButtonGroup} from '@blueprintjs/core'

class APIResultView extends Component
  @defaultProps: {
    route: null
    debug: false
    success: console.log
  }
  constructor: ->
    super arguments...
    @state = {response: null}
    @getData()

  componentDidUpdate: (prevProps)->
    return if prevProps.route == @props.route
    @getData()

  getData: ->
    {route, success} = @props
    return unless route?
    response = await get(route)
    @setState {response}
    success response

  render: ->
    {response} = @state
    if not response?
      return h Spinner
    {data} = response
    @props.children(data)

class PagedAPIView extends Component
  @defaultProps: {
    perPage: 20
  }
  constructor: (props)->
    super props
    @state = {currentPage: 0}

  setPage: (i)=> =>
    @setState {currentPage: i}

  renderPagination: ->
    {currentPage} = @state
    return h ButtonGroup, [
      h Button, {
        onClick: @setPage(currentPage-1)
        icon: 'arrow-left'
        disabled: currentPage == 0
      }, "Previous"
      h Button, {
        onClick: @setPage(currentPage+1)
        rightIcon: 'arrow-right'
      }, "Next"
    ]

  render: ->
    {route: base, perPage, children, rest...} = @props
    {currentPage} = @state

    offset = currentPage*perPage
    limit = perPage
    route = base + "?offset=#{offset}&limit=#{limit}"

    h 'div.pagination-container', rest, [
      h APIResultView, {route}, children
      @renderPagination()
    ]


export {APIResultView, PagedAPIView}

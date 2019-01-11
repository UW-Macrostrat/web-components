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
    count: null
    perPage: 20
    getTotalCount: (response)->
      {headers} = response
      console.log parseInt(headers['x-total-count'])
      return parseInt(headers['x-total-count'])
  }
  constructor: (props)->
    super props
    @state = {currentPage: 0, count: null}

  setPage: (i)=> =>
    @setState {currentPage: i}

  renderPagination: ->
    {perPage} = @props
    {currentPage, count} = @state
    nextDisabled = false
    if count?
      lastPage = Math.floor(count/perPage)
      if currentPage >= lastPage
        nextDisabled = true

    return h ButtonGroup, [
      h Button, {
        onClick: @setPage(currentPage-1)
        icon: 'arrow-left'
        disabled: currentPage == 0
      }, "Previous"
      h Button, {
        onClick: @setPage(currentPage+1)
        rightIcon: 'arrow-right'
        disabled: nextDisabled
      }, "Next"
    ]


  render: ->
    {
      route: base,
      perPage,
      children,
      getTotalCount,
      rest...
    } = @props
    {currentPage} = @state

    offset = currentPage*perPage
    limit = perPage
    route = base + "?offset=#{offset}&limit=#{limit}"

    success = (response)=>
      count = getTotalCount(response)
      @setState {count}

    h 'div.pagination-container', rest, [
      h APIResultView, {route, success}, children
      @renderPagination()
    ]


export {APIResultView, PagedAPIView}

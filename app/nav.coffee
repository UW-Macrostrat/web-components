React = require 'react'
{Link, withRouter} = require 'react-router-dom'
h = require 'react-hyperscript'
style = require './main.styl'
{Icon} = require 'react-fa'

class NavLink extends React.Component
  render: ->
    h 'li', [
      h Link, to: @props.to, @props.children
    ]


class BackLink extends React.Component
  render: ->
    h 'li', [
      h 'a', {onClick: @onClick}, [h Icon, name: 'arrow-left', size: '2x']
    ]
  onClick: =>
    console.log "Going home"
    {history} = @props
    history.goBack()

BackLink = withRouter(BackLink)

class NavBar extends React.Component
  render: ->
    h 'ul', className: style.navBar, [
      h NavLink, to: "/", "Home"
      h NavLink, to: "/sections", "Sections"
      h NavLink, to: "/carbon-isotopes", "Carbon Isotopes"
      h NavLink, to: "/lateral-variation", "Lateral Variation"
      h NavLink, to: "/map", "Map"
    ]

module.exports = { NavBar, NavLink, BackLink}

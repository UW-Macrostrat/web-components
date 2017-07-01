React = require 'react'
{Link} = require 'react-router-dom'
h = require 'react-hyperscript'
style = require './main.styl'

class NavLink extends React.Component
  render: ->
    h 'li', [
      h Link, to: @props.to, @props.children
    ]

class NavBar extends React.Component
  render: ->
    h 'ul', className: style.navBar, [
      h NavLink, to: "/", "Home"
      h NavLink, to: "/sections", "Sections"
      h NavLink, to: "/carbon-isotopes", "Carbon Isotopes"
      h NavLink, to: "/lateral-variation", "Lateral Variation"
      h NavLink, to: "/map", "Map"
    ]

module.exports = { NavBar, NavLink }

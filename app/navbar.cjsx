React = require 'react'
{Link} = require 'react-router-dom'

style = require './main.styl'

class NavLink extends React.Component
  render: ->
    <li><Link to={@props.to}>{@props.children}</Link></li>

class NavBar extends React.Component
  render: ->
    <ul className={style.navBar}>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/sections">Sections</NavLink>
      <NavLink to="/map" >Map</NavLink>
    </ul>

module.exports = NavBar

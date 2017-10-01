global.WEB_MODE=true

import React from 'react'
import { Component } from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'

class App extends Component
  render: ->
    return h 'div', [
     h 'h1', "Hello World!!!"
    ]


ReactDOM.render(
 h(App),
 document.getElementById('main')
 )

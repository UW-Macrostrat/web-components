React = require 'react'
ReactDOM = require 'react-dom'
{HashRouter,Route,Link} = require 'react-router-dom'

SectionPage = require './sections'
Map = require './map-viewer'

Router = ->
  <HashRouter>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/sections">Sections</Link></li>
        <li><Link to="/map">Map</Link></li>
      </ul>

      <hr/>

      <Route exact path="/" component={Home}/>
      <Route path="/sections" component={SectionPage}/>
      <Route path="/map" component={Map}/>
    </div>
  </HashRouter>

Home = ->
  <div>
    <h2>Naukluft Nappe Complex</h2>
  </div>

About = ->
  <div>
    <h2>About</h2>
  </div>

Topics = ({ match }) =>
  <div>
    <h2>Topics</h2>
    <ul>
      <li><Link to={"#{match.url}/rendering"}>Rendering with React</Link></li>
      <li><Link to={"#{match.url}/components"}>Components</Link></li>
      <li><Link to={"#{match.url}/props-v-state"}>Props v. State</Link></li>
    </ul>

    <Route path={"#{match.url}/:topicId"} component={Topic}/>
    <Route exact path={match.url} render={-><h3>Please select a topic.</h3>}/>
  </div>

Topic = ({ match }) =>
  <div>
    <h3>{match.params.topicId}</h3>
  </div>

ReactDOM.render(React.createElement(Router),document.querySelector('#main'))

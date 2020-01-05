import "core-js/stable"
import "regenerator-runtime/runtime"
import {render} from 'react-dom'
import h from '@macrostrat/hyper'
import App from './app'
import './main.styl'

render(h(App), document.querySelector('#app'));

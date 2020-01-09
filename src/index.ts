import "core-js/stable"
import "regenerator-runtime/runtime"

import {FocusStyleManager} from '@blueprintjs/core'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@macrostrat/ui-components/lib/index.css'
import '@macrostrat/column-components/dist/column-components.css'

import {render} from 'react-dom'
import h from '@macrostrat/hyper'
import App from './app'
import './main.styl'

render(h(App), document.querySelector('#app'));

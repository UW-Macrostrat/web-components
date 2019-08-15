import '@babel/polyfill' // this seems suspect
import {FocusStyleManager} from '@blueprintjs/core'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import './lib/index.css'

FocusStyleManager.onlyShowFocusOnTabs();

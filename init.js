/*
   This file MUST be compiled with Webpack, Parcel, or similar to
   work. You may need to copy its contents into your projects initialization
   script in order for CSS stylesheets, etc. to resolve properly.
*/
import '@babel/polyfill' // this seems suspect
import {FocusStyleManager} from '@blueprintjs/core'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import './lib/index.css'

FocusStyleManager.onlyShowFocusOnTabs();

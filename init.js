/*
   This file MUST be compiled with Webpack, Parcel, or similar to
   work. You may need to copy its contents into your projects initialization
   script in order for CSS stylesheets, etc. to resolve properly.
*/
// Babel polyfills
import "core-js/stable"
import "regenerator-runtime/runtime"

import {FocusStyleManager} from '@blueprintjs/core'
import '@blueprintjs/core/lib/css/blueprint.css'
import './lib/esm/index.css'

FocusStyleManager.onlyShowFocusOnTabs();

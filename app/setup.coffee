import {remote} from "electron"
paths = require.main.paths

# Setup helper functions
import css_modules from "pdf-printer/_helpers/stylus-css-modules"
import {css} from "pdf-printer/_helpers"
css_modules('global', paths) # global by default
css()

client_url = remote.getGlobal "BROWSER_SYNC_URL"

if client_url?
  current = document.currentScript
  script = document.createElement 'script'
  script.src = client_url
  script.async = true
  current.parentNode.insertBefore script, current


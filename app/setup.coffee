{remote} = require 'electron'

# Setup helper functions
require('node-cjsx').transform()
css_modules = require 'pdf-printer/_helpers/stylus-css-modules'
{css} = require 'pdf-printer/_helpers'
css_modules('global') # global by default
css()

client_url = remote.getGlobal "BROWSER_SYNC_URL"

if client_url?
  current = document.currentScript
  script = document.createElement 'script'
  script.src = client_url
  script.async = true
  current.parentNode.insertBefore script, current


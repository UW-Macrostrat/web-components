{remote} = require 'electron'
# Setup require hook for css modules
# works for .styl and .css extensions
hook = require 'css-modules-require-hook'
stylus = require 'stylus'
hook
  extensions: ['.styl'],
  preprocessCss: (css, filename)->
    stylus(css)
      .set('filename', filename)
      .render()
  processCss: (css)->
    style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = css
    document.head.appendChild(style)

client_url = remote.getGlobal "BROWSER_SYNC_URL"

if client_url?
  current = document.currentScript
  script = document.createElement 'script'
  script.src = client_url
  script.async = true
  current.parentNode.insertBefore script, current


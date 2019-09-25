import {remote} from "electron"

client_url = remote.getGlobal "BROWSER_SYNC_URL"

if client_url?
  current = document.currentScript
  script = document.createElement 'script'
  script.src = client_url
  script.async = true
  current.parentNode.insertBefore script, current


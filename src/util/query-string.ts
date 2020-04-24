function getQueryString() {
  const params = new URLSearchParams(document.location.search)
  let obj = {}
  params.forEach( (v,k) =>{
    const parsed = parseInt(v);
    obj[k] = isNaN(parsed) ? v : parsed
  })
  const hasKeys = Object.keys(obj).length > 0
  return hasKeys ? obj : null
}

interface QueryArgs {
  [k: string]: any
}

function setQueryString(args: QueryArgs) {
  const params = new URLSearchParams()
  for (const k in args) {
    params.set(k, args[k])
  }
  window.history.replaceState({}, '', `${document.location.pathname}?${params}`)
}

export {getQueryString, setQueryString}

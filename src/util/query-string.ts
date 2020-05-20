interface QueryArgs {
  [k: string]: any
}

function parseParams(paramString: string) {
  const params = new URLSearchParams(paramString)
  let obj = {}
  params.forEach( (v,k) =>{
    const parsed = parseInt(v);
    obj[k] = isNaN(parsed) ? v : parsed
  })
  const hasKeys = Object.keys(obj).length > 0
  return hasKeys ? obj : null
}

function encodeParams(args: QueryArgs){
  const params = new URLSearchParams()
  for (const k in args) {
    params.set(k, args[k])
  }
  return params
}

const updateURL = (joinWith: string, args: QueryArgs)=>{
  const params = encodeParams(args)
  window.history.replaceState({}, '', `${document.location.pathname}${joinWith}${params}`)
}

const getHashString = ()=> parseParams(document.location.hash)
const setHashString = (args: QueryArgs)=> updateURL("#", args)


const getQueryString = ()=> parseParams(document.location.search)
const setQueryString = (args: QueryArgs)=>  updateURL("?", args)

export {getQueryString, setQueryString, getHashString, setHashString}

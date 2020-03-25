import {useEffect} from 'react'

useAsyncEffect = (fn,dependencies)->
  vfn = ->
    fn()
    return
  useEffect vfn, dependencies

export {useAsyncEffect}

class LocalStorage
  constructor: (@name)->
  get: =>
    str = window.localStorage.getItem @name
    obj = JSON.parse str
    return obj
  set: (obj)=>
    str = JSON.stringify obj
    window.localStorage.setItem @name, str

export default LocalStorage

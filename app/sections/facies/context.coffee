import {Component, createContext} from "react"
import h from "react-hyperscript"
import {db, storedProcedure, query} from "../../db"

FaciesContext = createContext {facies:[],onColorChanged: ->}

class FaciesProvider extends Component
  constructor: (props)->
    super props
    @state = {
      facies: []
      facies_tracts: []
      __colorMap: {}
    }

  getFaciesColor: (id)=>
    {__colorMap} = @state
    return __colorMap[id] or null

  setFaciesColor: (id,color)=>
    sql = storedProcedure('set-facies-color', {baseDir: __dirname})
    await db.none sql, {id,color}
    @getFaciesData()

  getFaciesData: =>
    facies = await query('facies', null, {baseDir: __dirname})
    __colorMap = {}
    for f in facies
      __colorMap[f.id] = f.color

    @setState {facies, __colorMap}

  getFaciesTractData: =>
    facies_tracts = await query('facies-tract', null, {baseDir: __dirname})
    @setState {facies_tracts}

  componentDidMount: ->
    @getFaciesData()

  render: ->
    {facies} = @state
    {children, rest...} = @props
    procedures = do => {getFaciesColor, setFaciesColor} = @
    value = {
      facies
      procedures...
      rest...
    }
    h FaciesContext.Provider, {value}, children

export {FaciesContext, FaciesProvider}

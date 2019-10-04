import h from '~/hyper'
import {StratColumn} from './column'
import columnData from '~/example-data/Naukluft-Section-J.json'

prepareColumnData = (columnData)->
  columnData.height = 60
  columnData.surfaces.sort (a,b)->
    return a.bottom-b.bottom

  for surface,i in columnData.surfaces
    try
      surface.top = columnData.surfaces[i+1].bottom
    catch
      surface.top = columnData.height

  return columnData

App = ->
  h 'div.app', [
    h StratColumn, {
      data: prepareColumnData(columnData)
    }
  ]

export {App}

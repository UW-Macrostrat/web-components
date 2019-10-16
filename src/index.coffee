import h from '~/hyper'
import {StratColumn} from './column'
import {SettingsPanel} from './settings'
import {Component} from 'react'
import {StatefulComponent} from '@macrostrat/ui-components'

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


class App extends StatefulComponent
  constructor: (props)->
    super props
    @state = {
      imageURL: null
      columnData: prepareColumnData(columnData)
      inEditMode: true
      generalized: false
    }

  render: ->
    {generalized, inEditMode} = @state

    h 'div.app', [
      h StratColumn, {
        data: prepareColumnData(columnData)
        generalized
        inEditMode
      }
      h SettingsPanel, {
        inEditMode
        generalized
        @updateState
      }
    ]

export {App}

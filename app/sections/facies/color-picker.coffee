import {Component} from "react"
import h from "react-hyperscript"
import T from 'prop-types'
import {SwatchesPicker} from "react-color"
import {Popover} from "@blueprintjs/core"
import {FaciesContext} from './context'

class FaciesColorPicker extends Component
  @contextType: FaciesContext
  @propTypes: {
    facies: T.object.isRequired
  }
  render: ->
    {setFaciesColor} = @context
    {facies: d} = @props
    h 'div', [
      h SwatchesPicker, {
        color: d.color or 'black'
        onChangeComplete: (color)->
          setFaciesColor(d.id, color.hex)
        styles: {
          width: 500
          height: 570
        }
      }
    ]

BasicSwatch = ({facies: d})->
  h 'div.color-swatch', {style: {
    backgroundColor: d.color or 'black'
    width: '2em'
    height: '2em'
  }}

class FaciesSwatch extends Component
  @defaultProps: {
    isEditable: true
    facies: null
  }
  renderBasicSwatch: =>
    {facies} = @props
    h BasicSwatch, {facies}
  render: =>
    {facies, isEditable} = @props
    return @renderBasicSwatch unless @props.isEditable
    h Popover, {
      tetherOptions:{
        constraints: [{ attachment: "together", to: "scrollParent" }]
      }
    }, [
      @renderBasicSwatch()
      h FaciesColorPicker, {facies}
    ]

export {FaciesSwatch}

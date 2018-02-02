{LithologyColumn} = require './lithology'

class FaciesEditColumn extends LithologyColumn
  @defaultProps: {
    padWidth: false
    left: 0
  }
  render: ->
    {scale, left, shiftY} = @props
    {divisions} = @state
    {width, height} = @props
    transform = "translate(#{left} #{shiftY})"

    onClick = @onClick
    clipPath = "url(#{clipID})"
    h 'g.facies-edit', {transform, onClick}, divisions.map (d)=>
      @createRect d, {onClick}
  onClick: ->

module.exports = {FaciesEditColumn}

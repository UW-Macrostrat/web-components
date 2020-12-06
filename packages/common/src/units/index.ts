import h from '@macrostrat/hyper'
import { useContext } from 'react'
import {
  LithologyColumn,
  LithologySymbolDefs,
  ColumnContext,
  ColumnLayoutContext,
  GeologicPatternContext,
  useUUID,
} from '@macrostrat/column-components'
import { IUnit } from './types'
import { resolveID, scalePattern } from './resolvers'
import UnitNamesColumn from './names'

interface UnitProps {
  division: IUnit
  resolveID(IUnit): string
  UUID: string
}

const Unit = (props: UnitProps) => {
  const { division: d, resolveID, UUID } = props
  const { resolvePattern } = useContext(GeologicPatternContext)
  const { scale } = useContext(ColumnContext)
  const { width } = useContext(ColumnLayoutContext)

  const y = scale(d.t_age)
  const height = scale(d.b_age) - y

  const patternID = resolveID(d)
  const v = resolvePattern(patternID)

  const fill = v != null ? `url(#${UUID}-${patternID})` : '#aaa'

  return h('rect.unit', {
    x: 0,
    y,
    width,
    height,
    fill,
    onMouseOver() {
      console.log(d)
    },
  })
}

const UnitBoxes = props => {
  const { divisions } = useContext(ColumnContext)
  const UUID = useUUID()

  return h('g.divisions', [
    h(LithologySymbolDefs, { resolveID, UUID, scalePattern }),
    h(
      'g',
      divisions.map(div => {
        return h(Unit, {
          division: div,
          resolveID,
          UUID,
        })
      })
    ),
  ])
}

const UnitsColumn = props => {
  /*
  A column showing units with USGS color fill
  */
  return h(LithologyColumn, { width: 100 }, [h(UnitBoxes)])
}

interface ICompositeUnitProps {
  width: number
  columnWidth: number
  gutterWidth?: number
  labelOffset?: number
}

const CompositeUnitsColumn = (props: ICompositeUnitProps) => {
  /*
  A column with units and names either
  overlapping or offset to the right
  */
  const { columnWidth, width, gutterWidth, labelOffset } = props

  return h([
    h(UnitsColumn, {
      width: columnWidth,
    }),
    h(UnitNamesColumn, {
      transform: `translate(${columnWidth + gutterWidth})`,
      paddingLeft: labelOffset,
      width: width - columnWidth - gutterWidth,
    }),
  ])
}

CompositeUnitsColumn.defaultProps = {
  gutterWidth: 10,
  labelOffset: 30,
}

export {
  UnitsColumn,
  UnitNamesColumn,
  CompositeUnitsColumn,
  ICompositeUnitProps,
}

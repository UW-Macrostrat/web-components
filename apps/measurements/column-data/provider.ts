import { useContext, createContext } from 'react'
import h from '@macrostrat/hyper'

interface ColumnCtx {
  col_id: number
}

const ColumnDataContext = createContext<ColumnCtx | null>(null)

function ColumnDataProvider(props: React.PropsWithChildren<ColumnCtx>) {
  const { col_id, children } = props
  const value = { col_id }
  return h(ColumnDataContext.Provider, { value, children })
}

const useColumnData = () => useContext(ColumnDataContext)

export { ColumnDataProvider, ColumnDataContext, useColumnData }

import {createContext, useContext, useState, useEffect} from 'react'
import h from "@macrostrat/hyper"

type DarkModeState = {isEnabled: boolean, isAutoset: boolean}

type DarkModeUpdater = (enabled?: boolean)=>void

const ValueContext = createContext<DarkModeState|null>(null)
const UpdaterContext = createContext<DarkModeUpdater|null>(null)

const matcher = window?.matchMedia('(prefers-color-scheme: dark)')

const systemDarkMode = (): DarkModeState => ({
  isEnabled: matcher?.matches ?? false,
  isAutoset: true
})

const DarkModeProvider = (props: {children?: React.ReactNode})=>{

  const [value, updateValue] = useState(systemDarkMode())

  const update: DarkModeUpdater = (enabled: boolean)=>{
    const isEnabled = enabled ?? !value.isEnabled
    updateValue({isAutoset: false, isEnabled})
  }

  useEffect(()=>{
    matcher?.addEventListener?.('change', e =>{
      if (value.isAutoset) updateValue(systemDarkMode())
    })
  })

  return h(ValueContext.Provider, {value},
    h(UpdaterContext.Provider, {value: update}, props.children)
  )
}

const useDarkMode = ()=> useContext(ValueContext)
const inDarkMode = ()=> useDarkMode()?.isEnabled ?? false
const darkModeUpdater = ()=> useContext(UpdaterContext)

export {DarkModeProvider, useDarkMode, inDarkMode, darkModeUpdater}

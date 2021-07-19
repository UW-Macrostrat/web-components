import h from '~/hyper'
import {
  Navbar, Button,
  Menu, Icon,
  Intent
} from '@blueprintjs/core'
import T from 'prop-types'

import {Page} from './enum'

TitleBar = (props)->
  {toggleSettings} = props
  h Navbar, [
    h Navbar.Group, [
      h Navbar.Heading, "Column builder"
      h Navbar.Divider
      h Button, {
        minimal: true,
        icon: 'settings',
        onClick: toggleSettings
      }, "Settings"
    ]
  ]

TitleBar.propTypes = {
  toggleSettings: T.func
}

GiantIconButton = (props)->
  {icon, iconSize, rest...} = props
  iconSize ?= 24
  h Button, {
    large: true
    minimal: true
    rest...
  }, (
    h Icon, {icon, iconSize}
  )

SideMenu = (props)->
  {currentPage, setPage} = props
  h 'div.menu-column', [
    h 'div.main-menu', [
      h GiantIconButton, {
        onClick: setPage(Page.SETTINGS)
        active: currentPage == Page.SETTINGS
        icon: 'settings'
      }
      h GiantIconButton, {
        onClick: setPage(Page.ABOUT)
        active: currentPage == Page.ABOUT
        icon: 'info-sign'
      }
    ]
  ]

export {TitleBar, SideMenu}

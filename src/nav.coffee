import h from '~/hyper'
import {Navbar, Button, Alignment, Menu} from '@blueprintjs/core'
import T from 'prop-types'

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

SideMenu = (props)->
  {toggleSettings} = props
  h 'div.menu-column', [
    h Menu, {className: 'main-menu'}, [
      h Menu.Item, {
        icon: 'settings',
        onClick: toggleSettings
        text: "Settings"
      }
    ]
  ]

export {TitleBar, SideMenu}

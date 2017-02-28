{register} = require 'electron-localshortcut'
fs = require 'fs'

module.exports = (window)->
  zoomShortcuts =
    '=': 'zoom-in'
    '-': 'zoom-out'
    '0': 'zoom-reset'

  register window, "CommandOrControl+-", =>
    window.webContents.send 'zoom-out'
  register window, "CommandOrControl+=", =>
    window.webContents.send 'zoom-in'
  register window, "CommandOrControl+0", =>
    window.webContents.send 'zoom-reset'
  register window, "CommandOrControl+P", =>
    window.webContents.printToPDF {
        landscape: true,
        pageSize: {height: 300000, width: 300000}
        printBackground: true
      }, (e,data)->
      fs.writeFile '/Users/Daven/Desktop/printout.pdf', data

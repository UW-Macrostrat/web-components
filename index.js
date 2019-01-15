var path = require('path');

var appRoot = __dirname;
require('electron-compile').init(appRoot, require.resolve('./main.js'));


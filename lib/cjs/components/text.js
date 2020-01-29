'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var h = _interopDefault(require('react-hyperscript'));

exports.Markdown = function Markdown(_ref) {
  var src = _ref.src,
      rest = __chunk_1.objectWithoutProperties(_ref, ["src"]);

  return h('div', {
    dangerouslySetInnerHTML: __chunk_1.objectSpread2({
      __html: src
    }, rest)
  });
};

exports.HTML = exports.Markdown;
//# sourceMappingURL=text.js.map

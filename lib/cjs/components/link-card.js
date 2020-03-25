'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var h = _interopDefault(require('react-hyperscript'));
var classNames = _interopDefault(require('classnames'));
var reactRouterDom = require('react-router-dom');

exports.LinkCard = function LinkCard(props) {
  var className, elevation, href, rest, to;
  to = props.to;
  href = props.href;
  className = props.className;
  elevation = props.elevation;
  rest = __chunk_1.objectWithoutProperties(props, ["to", "href", "className", "elevation"]);

  if (elevation == null) {
    elevation = 0;
  }

  className = classNames("link-card", "bp3-card", "bp3-elevation-".concat(elevation), className);

  if (to == null) {
    return h('a', __chunk_1.objectSpread2({
      href: href,
      className: className
    }, rest));
  }

  return h(reactRouterDom.Link, __chunk_1.objectSpread2({
    to: to,
    className: className
  }, rest));
};
//# sourceMappingURL=link-card.js.map

'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');
var reactRouterDom = require('react-router-dom');

exports.LinkCard = function LinkCard(props) {
  var className, href, inner, rest, target, to;
  to = props.to;
  href = props.href;
  target = props.target;
  rest = __chunk_1.objectWithoutProperties(props, ["to", "href", "target"]);
  className = "link-card";
  inner = h(core.Card, __chunk_1.objectSpread2({}, rest));

  if (to == null) {
    return h('a', {
      href: href,
      target: target,
      className: className
    }, inner);
  }

  return h(reactRouterDom.Link, {
    to: to,
    className: className
  }, inner);
};
//# sourceMappingURL=link-card.js.map

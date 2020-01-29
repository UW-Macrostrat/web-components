import { objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import h from 'react-hyperscript';
import { Card } from '@blueprintjs/core';
import { Link } from 'react-router-dom';

var LinkCard;

LinkCard = function LinkCard(props) {
  var className, href, inner, rest, target, to;
  to = props.to;
  href = props.href;
  target = props.target;
  rest = _objectWithoutProperties(props, ["to", "href", "target"]);
  className = "link-card";
  inner = h(Card, _objectSpread2({}, rest));

  if (to == null) {
    return h('a', {
      href: href,
      target: target,
      className: className
    }, inner);
  }

  return h(Link, {
    to: to,
    className: className
  }, inner);
};

export { LinkCard };
//# sourceMappingURL=link-card.js.map

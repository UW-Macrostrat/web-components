import { objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import h from 'react-hyperscript';
import classNames from 'classnames';
import { Link } from 'react-router-dom';

var LinkCard;

LinkCard = function LinkCard(props) {
  var className, elevation, href, rest, to;
  to = props.to;
  href = props.href;
  className = props.className;
  elevation = props.elevation;
  rest = _objectWithoutProperties(props, ["to", "href", "className", "elevation"]);

  if (elevation == null) {
    elevation = 0;
  }

  className = classNames("link-card", "bp3-card", "bp3-elevation-".concat(elevation), className);

  if (to == null) {
    return h('a', _objectSpread2({
      href: href,
      className: className
    }, rest));
  }

  return h(Link, _objectSpread2({
    to: to,
    className: className
  }, rest));
};

export { LinkCard };
//# sourceMappingURL=link-card.js.map

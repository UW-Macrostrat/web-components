import h from 'react-hyperscript';
import { Card } from '@blueprintjs/core';
import { Link } from 'react-router-dom';

var LinkCard;

LinkCard = function(props) {
  var className, href, inner, rest, target, to;
  ({to, href, target, ...rest} = props);
  className = "link-card";
  inner = h(Card, {...rest});
  if (to == null) {
    return h('a', {href, target, className}, inner);
  }
  return h(Link, {to, className}, inner);
};

export { LinkCard };

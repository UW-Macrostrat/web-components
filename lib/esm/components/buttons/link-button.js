import { objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2 } from '../../_virtual/_rollupPluginBabelHelpers.js';
import h from 'react-hyperscript';
import { AnchorButton } from '@blueprintjs/core';
import classNames from 'classnames';
import { withRouter, NavLink } from 'react-router-dom';

var LinkButton, NavLinkButton;

LinkButton = withRouter(function (props) {
  var history, location, match, onClick, rest, staticContext, to;
  to = props.to;
  history = props.history;
  staticContext = props.staticContext;
  onClick = props.onClick;
  match = props.match;
  location = props.location;
  rest = _objectWithoutProperties(props, ["to", "history", "staticContext", "onClick", "match", "location"]);

  onClick = function onClick(event) {
    if (to == null) {
      return;
    }

    history.push(to);
    return event.preventDefault();
  };

  return h(AnchorButton, _objectSpread2({
    onClick: onClick
  }, rest));
});

NavLinkButton = function NavLinkButton(props) {
  var className, rest;
  className = props.className;
  rest = _objectWithoutProperties(props, ["className"]);
  className = classNames(className, "bp3-button bp3-minimal");
  return h(NavLink, _objectSpread2({
    className: className
  }, rest));
};

export { LinkButton, NavLinkButton };
//# sourceMappingURL=link-button.js.map

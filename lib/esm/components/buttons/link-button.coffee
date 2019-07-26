import h from 'react-hyperscript';
import { AnchorButton } from '@blueprintjs/core';
import classNames from 'classnames';
import { withRouter, NavLink } from 'react-router-dom';

var LinkButton, NavLinkButton;

// Button that forms a React Router link
LinkButton = withRouter(function(props) {
  var history, location, match, onClick, rest, staticContext, to;
  ({to, history, staticContext, onClick, match, location, ...rest} = props);
  onClick = function(event) {
    if (to == null) {
      return;
    }
    history.push(to);
    return event.preventDefault();
  };
  return h(AnchorButton, {onClick, ...rest});
});

NavLinkButton = function(props) {
  var className, rest;
  ({className, ...rest} = props);
  className = classNames(className, "bp3-button bp3-minimal");
  return h(NavLink, {className, ...rest});
};

export { LinkButton, NavLinkButton };

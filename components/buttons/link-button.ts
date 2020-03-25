/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';
import {NavLink, withRouter} from 'react-router-dom';
import {Button, AnchorButton} from '@blueprintjs/core';
import classNames from 'classnames';

// Button that forms a React Router link
const LinkButton = withRouter(function(props){
  let {to, history, staticContext, onClick, match, location, ...rest} = props;

  onClick = function(event){
    if (to == null) { return; }
    history.push(to);
    return event.preventDefault();
  };

  return h(AnchorButton, {onClick, ...rest});});

const NavLinkButton = function(props){
  let {className, ...rest} = props;
  className = classNames(className, "bp3-button bp3-minimal");
  return h(NavLink, {className, ...rest});
};

export {LinkButton, NavLinkButton};

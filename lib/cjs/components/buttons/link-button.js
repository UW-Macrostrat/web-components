'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../../_virtual/_rollupPluginBabelHelpers.js');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');
var classNames = _interopDefault(require('classnames'));
var reactRouterDom = require('react-router-dom');

exports.LinkButton = reactRouterDom.withRouter(function (props) {
  var history, location, match, onClick, rest, staticContext, to;
  to = props.to;
  history = props.history;
  staticContext = props.staticContext;
  onClick = props.onClick;
  match = props.match;
  location = props.location;
  rest = __chunk_1.objectWithoutProperties(props, ["to", "history", "staticContext", "onClick", "match", "location"]);

  onClick = function onClick(event) {
    if (to == null) {
      return;
    }

    history.push(to);
    return event.preventDefault();
  };

  return h(core.AnchorButton, __chunk_1.objectSpread2({
    onClick: onClick
  }, rest));
});

exports.NavLinkButton = function NavLinkButton(props) {
  var className, rest;
  className = props.className;
  rest = __chunk_1.objectWithoutProperties(props, ["className"]);
  className = classNames(className, "bp3-button bp3-minimal");
  return h(reactRouterDom.NavLink, __chunk_1.objectSpread2({
    className: className
  }, rest));
};
//# sourceMappingURL=link-button.js.map

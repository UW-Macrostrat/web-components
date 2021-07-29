import h from "@macrostrat/hyper";
import { NavLink, withRouter, Link } from "react-router-dom";
import { AnchorButton } from "@blueprintjs/core";
import classNames from "classnames";
import { LinkCard as LinkCard_ } from "../link-card";

// Button that forms a React Router link
const LinkButton = withRouter(function(props) {
  // @ts-ignore
  let { to, history, staticContext, onClick, match, location, ...rest } = props;

  onClick = function(event) {
    if (to == null) {
      return;
    }
    history.push(to);
    return event.preventDefault();
  };

  return h(AnchorButton, { onClick, ...rest });
});

const NavLinkButton = function(props) {
  let { className, ...rest } = props;
  className = classNames(className, "bp3-button bp3-minimal");
  return h(NavLink, { className, ...rest });
};

const LinkCard = props => h(LinkCard_, { linkComponent: Link, ...props });

export { LinkButton, NavLinkButton, LinkCard };

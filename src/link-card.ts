import h from "react-hyperscript";
import { Link } from "react-router-dom";
import classNames from "classnames";

const LinkCard = function(props) {
  let { to, href, className, elevation, ...rest } = props;
  if (elevation == null) {
    elevation = 0;
  }

  className = classNames(
    "link-card",
    "bp3-card",
    `bp3-elevation-${elevation}`,
    className
  );

  if (to == null) {
    return h("a", { href, className, ...rest });
  }
  return h(Link, { to, className, ...rest });
};

export { LinkCard };

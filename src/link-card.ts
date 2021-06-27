import h from "react-hyperscript";
import classNames from "classnames";

function LinkCard(props) {
  let {
    linkComponent = "a",
    to,
    href,
    className,
    elevation = 0,
    ...rest
  } = props;

  className = classNames(
    "link-card",
    "bp3-card",
    `bp3-elevation-${elevation}`,
    className
  );

  if (linkComponent == "a" && href == null) href = to;
  return h(linkComponent, { to, href, className, ...rest });
}

export { LinkCard };

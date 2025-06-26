import h from "@macrostrat/hyper";
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
    "bp5-card",
    `bp5-elevation-${elevation}`,
    className,
  );

  if (linkComponent == "a" && href == null) href = to;
  return h(linkComponent, { to, href, className, ...rest });
}

export { LinkCard };

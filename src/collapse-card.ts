import h from "@macrostrat/hyper";
import classNames from "classnames";
import { Collapse, Card, ICardProps, ICollapseProps } from "@blueprintjs/core";

type CollapseCardProps = ICardProps &
  Pick<ICollapseProps, "isOpen" | "keepChildrenMounted" | "transitionDuration">;

export function CollapseCard(props: CollapseCardProps) {
  /** Collapsible card taken from COSMOS visualizer */
  const {
    isOpen,
    keepChildrenMounted = true,
    transitionDuration = 500,
    className,
    children,
    ...rest
  } = props;
  return h(Collapse, { isOpen, keepChildrenMounted, transitionDuration }, [
    h("div.collapse-card-outer", [
      h(
        Card,
        {
          elevation: 1,
          className: classNames(className, "mui-collapse-card"),
          ...rest,
        },
        [h("div.inner", children)]
      ),
    ]),
  ]);
}

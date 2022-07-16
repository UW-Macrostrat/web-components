import { hyperStyled } from "@macrostrat/hyper";
import React from "react";
//@ts-ignore
import styles from "./hierarchy.module.scss";

const h = hyperStyled(styles);

export interface IHierarchy {
  name: string;
  units?: number;
  subhierarchy?: IHierarchy[];
  active?: boolean;
  onClick?: (e: MouseEvent) => void;
}

function Hierarchy(props: IHierarchy): React.ReactElement {
  const {
    subhierarchy = [],
    units = 0,
    name,
    active = false,
    onClick = (e) => {},
  } = props;

  const className = active ? ".active" : "";

  return h(`div.hierarchy-container  ${className}`, { onClick }, [
    h("div.hierarchy-name", [name, h("span.badge", [units])]),
    h.if(subhierarchy.length > 0)("div.hierarchy-children", [
      subhierarchy.map((c, i) => {
        return h(Hierarchy, { ...c, key: i });
      }),
    ]),
  ]);
}

export { Hierarchy };

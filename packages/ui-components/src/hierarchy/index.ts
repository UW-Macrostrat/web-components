import { hyperStyled } from "@macrostrat/hyper";
import styles from "./hierarchy.module.scss";

const h = hyperStyled(styles);

export interface IHierarchy {
  name: string;
  units?: number;
  kinder?: IHierarchy[];
  active?: boolean;
  onClick?: (e) => void;
}

function Hierarchy(props: IHierarchy) {
  console.log(props);
  const {
    kinder = [],
    units = 0,
    name,
    active = false,
    onClick = (e) => {},
  } = props;

  const className = active ? ".active" : "";

  return h(`div.hierarchy-container  ${className}`, { onClick }, [
    h("div.hierarchy-name", [name, h("span.badge", [units])]),
    h.if(kinder.length > 0)("div.hierarchy-children", [
      kinder.map((c, i) => {
        return h(Hierarchy, { ...c, key: i });
      }),
    ]),
  ]);
}

export { Hierarchy };

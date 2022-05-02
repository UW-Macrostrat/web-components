import { hyperStyled } from "@macrostrat/hyper";
import styles from "./pub.module.scss";

const h = hyperStyled(styles);

interface PubI {
  doi: string;
  title: string;
}

export function Publication(props: PubI) {
  const { doi, title } = props;

  const href = `https://dx.doi.org/${doi}`;
  return h("a.publication", { href, target: "_blank" }, [
    h("div.publication", [
      h("span.title", title),
      " – ",
      h("span.doi-info", [
        h("span.label", "DOI:"),
        h("span.doi.bp4-monospace-text", doi),
      ]),
    ]),
  ]);
}

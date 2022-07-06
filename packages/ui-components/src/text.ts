import h from "@macrostrat/hyper";
import { ReactElement } from "react";

const Markdown = ({ src, ...rest }): ReactElement =>
  h("div", { dangerouslySetInnerHTML: { __html: src, ...rest } });

const HTML = Markdown;

export { Markdown, HTML };

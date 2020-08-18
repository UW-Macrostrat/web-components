import h from "react-hyperscript";

const Markdown = ({ src, ...rest }) =>
  h("div", { dangerouslySetInnerHTML: { __html: src, ...rest } });

const HTML = Markdown;

export { Markdown, HTML };

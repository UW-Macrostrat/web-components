import { AuthorList } from "@macrostrat/ui-components";
import h from "./main.module.sass";
import { ExpandableDetailsPanel } from "../expansion-panel";

export function Article(props) {
  const { data, expanded } = props;

  // Attempt to pull out only the year and not the whole date
  let year = null;
  try {
    year = data.coverDate ? data.coverDate.match(/\d{4}/)[0] : null;
  } catch (e) {}

  const authors = data?.authors?.split("; ") ?? [];

  const authorList =
    authors.length > 0 ? h(AuthorList, { names: authors }) : "Unknown";

  const headerElement = h("p.article-title", [
    h("span.article-author", authorList),
    ", ",
    h.if(year != null)([h("span.year", year), ", "]),
    h(
      "a.title-link",
      { href: data.URL, target: "_blank" },
      h("strong", { dangerouslySetInnerHTML: { __html: data.title } }),
    ),
    ".",
  ]);

  return h(ExpandableDetailsPanel, { headerElement, expanded }, [
    h(
      "ul.quotes",
      data.highlight.map((snippet, si) =>
        h("li.xdd-snippet", {
          key: si,
          dangerouslySetInnerHTML: { __html: `...${snippet}...` },
        }),
      ),
    ),
  ]);
}

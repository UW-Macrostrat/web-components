import React, { useState } from "react";
import { Collapse, Button } from "@blueprintjs/core";
import { AuthorList } from "@macrostrat/ui-components";
import h from "@macrostrat/hyper";

export function Article(props) {
  const [expanded, setExpanded] = useState(false);
  const { data } = props;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  // Attempt to pull out only the year and not the whole date
  let year;
  try {
    year = data.coverDate ? data.coverDate.match(/\d{4}/)[0] : "";
  } catch (e) {
    year = "";
  }

  const authors = data?.authors?.split("; ") ?? [];

  const authorList =
    authors.length > 0 ? h(AuthorList, { names: authors }) : "Unknown";

  const iconName = expanded ? "chevron-up" : "chevron-down";

  return h("div.article", [
    h("div.article-title", [
      h("p.article-author", [authorList, year.length ? ` ${year}. ` : ""]),
      h(
        "a.title-link",
        { href: data.URL, target: "_blank" },
        h("strong", [data.title + "."]),
      ),
      h(
        "span",
        {},
        h(Button, {
          onClick: toggleExpand,
          minimal: true,
          rightIcon: iconName,
          className: "flat-btn",
        }),
      ),
    ]),
    h(
      Collapse,
      { isOpen: expanded },
      h(
        "span",
        { className: expanded ? "" : "hidden" },
        h(
          "div.quotes",
          {},
          data.highlight.map((snippet, si) =>
            h("p.gdd-snippet", {
              key: si,
              dangerouslySetInnerHTML: { __html: `...${snippet}...` },
            }),
          ),
        ),
      ),
    ),
  ]);
}

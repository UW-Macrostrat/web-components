import { Article } from "./article";
import { Divider } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import { SubExpansionPanel } from "@macrostrat/map-interface";

export interface XDDSnippet {
  pubname: string;
  publisher: string;
  _gddid: string;
  title: string;
  doi: string;
  coverDate: string;
  URL: string;
  authors: string;
  hits: number;
  highlight: string[];
}

function Journal(props) {
  return h("div.journal", [
    h("div.journal-title", [
      h("h2.journal-title-text", [
        props.data.name,
        h("small.journal-source", [props.data]),
      ]),
    ]),
    h(Divider),
    props.data.articles.map((article, i) => {
      return h(Article, { key: i, data: article });
    }),
  ]);
}

type JournalProps = {
  articles: XDDSnippet[];
  name: string;
  publisher: string;
  nestedExpanded?: boolean;
};

// Still up for review
export function JournalLegacy(props: JournalProps) {
  const { articles, name, publisher, nestedExpanded } = props;

  const helpText = articles[0].pubname;

  return h(
    SubExpansionPanel,
    {
      title: name,
      helpText: publisher,
      expanded: nestedExpanded,
    },
    [
      articles.map((article, i) => {
        return h(Article, { key: i, data: article });
      }),
    ],
  );
}

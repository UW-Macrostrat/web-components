import { Article } from "./article";
import h from "@macrostrat/hyper";
import { ExpansionPanel } from "../expansion-panel";

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

type JournalProps = {
  articles: XDDSnippet[];
  name: string;
  publisher: string;
  expanded?: boolean;
  detailsExpanded?: boolean;
};

// Still up for review
export function Journal(props: JournalProps) {
  const { articles, name, publisher, expanded, detailsExpanded } = props;

  return h(
    ExpansionPanel,
    {
      title: name,
      helpText: publisher,
      expanded,
      className: "journal",
    },
    [
      articles.map((article, i) => {
        return h(Article, { key: i, data: article, expanded: detailsExpanded });
      }),
    ],
  );
}

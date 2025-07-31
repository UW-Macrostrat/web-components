import { Spinner } from "@blueprintjs/core";
import h from "@macrostrat/hyper";
import Journal from "./Journal";
import { ExpansionPanel } from "@macrostrat/map-interface";

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

export function XddExpansion({ xddInfo, expanded = false, nestedExpanded = true }) {
  return h(xDDPanelCore, {
    className: "regional-panel",
    data: xddInfo,
    isFetching: xddInfo == undefined || xddInfo.length === 0,
    expanded,
    nestedExpanded,
  });
}

export function xDDPanelCore({ isFetching, data: xddInfo, expanded, nestedExpanded, ...rest }) {
  const groupedData = groupSnippetsByJournal(xddInfo);

  console.log("expanded", expanded);

  return h(
    ExpansionPanel,
    {
      className: "regional-panel",
      title: "Primary literature",
      helpText: "via xDD",
      ...rest,
      expanded,
    },
    [
      h.if(isFetching)(Spinner),
      h.if(!isFetching && xddInfo.length > 0)([
        Array.from(groupedData.entries())?.map(([journal, snippets]) => {
          return h(Journal, {
            nestedExpanded,
            name: journal,
            articles: snippets,
            publisher: snippets[0].publisher,
            key: journal,
          });
        }),
      ]),
    ],
  );
}

function groupSnippetsByJournal(
  snippets: XDDSnippet[],
): Map<string, XDDSnippet[]> {
  const journals = new Map<string, XDDSnippet[]>();
  if (!snippets || snippets.length === 0) {
    return journals;
  }
  for (let snippet of snippets) {
    const { pubname: journal } = snippet;
    if (!journals.has(journal)) {
      journals.set(journal, []);
    }
    journals.get(journal).push(snippet);
  }
  return journals;
}

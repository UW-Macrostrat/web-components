import { Spinner } from "@blueprintjs/core";
import h from "./main.module.sass";
import { XDDSnippet, Journal } from "./journal";
import { ExpansionPanel } from "../expansion-panel";
import { useMemo } from "react";
import classNames from "classnames";

export function xDDExpansionPanel({
  data,
  expanded = false,
  isFetching = false,
  nestedExpanded = true,
  detailsExpanded = null,
  className,
}) {
  const groupedData = useMemo(() => groupXDDSnippetsByJournal(data), [data]);

  const _shouldRenderSpinner = isFetching && !data;

  return h(
    ExpansionPanel,
    {
      className: classNames("xdd-panel", className),
      title: "Primary literature",
      helpText: "via xDD",
      expanded,
    },
    [
      h.if(_shouldRenderSpinner)(Spinner),
      h.if(!_shouldRenderSpinner)([
        Array.from(groupedData.entries())?.map(([journal, snippets]) => {
          return h(Journal, {
            expanded: nestedExpanded,
            name: journal,
            articles: snippets,
            publisher: snippets[0].publisher,
            key: journal,
            detailsExpanded,
          });
        }),
      ]),
    ],
  );
}

export function groupXDDSnippetsByJournal(
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

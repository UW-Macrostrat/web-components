import { Component } from "react";
import h from "@macrostrat/hyper";
import { Card, Classes } from "@blueprintjs/core";

import { APIResultView } from "../api";
import { LinkCard } from "../link-card";
import { AuthorList } from "../citations";

const VolumeNumber = function(props) {
  const { volume, number } = props;
  const _ = [];
  if (volume != null && volume !== "") {
    _.push(h("span.volume", null, volume));
  }
  if (number != null && number !== "") {
    _.push("(");
    _.push(h("span.number", number));
    _.push(")");
  }
  if (_.length === 0) {
    return null;
  }
  _.push(", ");
  return h("span", null, _);
};

function InnerCard(props: { [k: string]: any }) {
  let { title, author, doi, journal, identifier, volume, number, year } = props;
  try {
    ({ id: doi } = identifier.find(d => d.type === "doi"));
  } catch (error) {
    doi = null;
  }

  const names = author.map(function(d) {
    const n = d.name.split(", ");
    n.reverse();
    return n.join(" ");
  });

  return h([
    h(AuthorList, { names, limit: 3 }),
    ", ",
    h("span.title", title),
    ", ",
    h("span.journal", journal),
    ", ",
    h(VolumeNumber, { volume, number }),
    h("span.year", year),
    ", ",
    h("span.doi-title", "doi: "),
    h("span.doi", doi)
  ]);
}

function GeoDeepDiveSwatchInnerBare(props: any) {
  return h(Card, { interactive: false, className: "gdd-article" }, [
    // @ts-ignore
    h(InnerCard, props)
  ]);
}

class GeoDeepDiveSwatch extends Component<any, any> {
  render() {
    let url;
    const { link, ...rest } = this.props;
    try {
      ({ url } = link.find(d => d.type === "publisher"));
    } catch (error) {
      url = null;
    }
    return h(
      LinkCard,
      {
        href: url,
        target: "_blank",
        className: "gdd-article"
      },
      // @ts-ignore
      h(InnerCard, rest)
    );
  }
}

function GeoDeepDiveRelatedTerms(props: { data: any[] }) {
  const { data } = props;
  return h([
    h("h1", "Related Terms"),
    h(
      "ul#related_terms",
      data.map(item => h("li", item[0]))
    )
  ]);
}

const PlaceholderReference = () => {
  return h(
    Card,
    {
      className: `gdd-article ${Classes.SKELETON}`
    },
    "word ".repeat(35)
  );
};

const GDDReferenceCard = (props: { docid: string }) => {
  const { docid } = props;
  return h(
    APIResultView,
    {
      route: "https://geodeepdive.org/api/articles",
      params: { docid },

      opts: {
        unwrapResponse(res) {
          return res.success.data[0];
        },
        memoize: true
      },
      placeholder: PlaceholderReference
    },
    data => {
      try {
        return h(GeoDeepDiveSwatch, data);
      } catch (error) {
        return null;
      }
    }
  );
};

export {
  GDDReferenceCard,
  GeoDeepDiveSwatch,
  GeoDeepDiveSwatchInnerBare,
  GeoDeepDiveRelatedTerms
};

// @ts-nocheck
import h from "@macrostrat/hyper";
import { Card } from "@blueprintjs/core";

import { APIResultView } from "../api";
import { LinkCard } from "../link-card";
import { AuthorList } from "../citations";

const VolumeNumber = function (props) {
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

export function xDDReferenceInformation(props: { [k: string]: any }) {
  let { title, author, doi, journal, identifier, volume, number, year } = props;
  try {
    ({ id: doi } = identifier.find((d) => d.type === "doi"));
  } catch (error) {
    doi = null;
  }

  const names = author.map(function (d) {
    const n = d.name.split(", ");
    n.reverse();
    return n.join(" ");
  });

  return h([
    h.if(author.length > 0)([h(AuthorList, { names, limit: 3 }), ", "]),
    h("span.title", title),
    ", ",
    h("span.journal", journal),
    ", ",
    h(VolumeNumber, { volume, number }),
    h("span.year", year),
    h.if(doi != null)([
      ", ",
      h("span.doi-title", "doi: "),
      h(
        "a.doi",
        { href: `https://doi.org/${doi}`, target: "_blank" },
        h("code", doi),
      ),
    ]),
  ]);
}

function GeoDeepDiveSwatchInnerBare(props: any) {
  return h(Card, { interactive: false, className: "gdd-article" }, [
    // @ts-ignore
    h(InnerCard, props),
  ]);
}

function GeoDeepDiveSwatch({ wrapper = xDDLinkCard, data, docid }) {
  if (data == null) {
    return h(wrapper, ["Loading... "]);
  }

  let url;
  const { link, ...rest } = data;
  try {
    ({ url } = link.find((d) => d.type === "publisher"));
  } catch (error) {
    url = null;
  }
  return h(wrapper, { href: url, docid }, h(xDDReferenceInformation, data));
}

function xDDLinkCard(props: { href: string }) {
  const { href, children, ...rest } = props;
  return h(LinkCard, {
    target: "_blank",
    className: "gdd-article",
    href,
    children,
  });
}

function GeoDeepDiveRelatedTerms(props: { data: any[] }) {
  const { data } = props;
  return h([
    h("h1", "Related Terms"),
    h(
      "ul#related_terms",
      data.map((item) => h("li", item[0])),
    ),
  ]);
}

const GDDReferenceCard = (props: { docid: string }) => {
  const { docid, wrapper } = props;
  return h(
    APIResultView,
    {
      route: "https://xdd.wisc.edu/api/articles",
      params: { docid },

      opts: {
        unwrapResponse(res) {
          return res.success.data[0];
        },
        memoize: true,
      },
      placeholder: () => h(GeoDeepDiveSwatch, { wrapper, data: null, docid }),
    },
    (data) => {
      try {
        return h(GeoDeepDiveSwatch, { wrapper, data, docid });
      } catch (error) {
        return null;
      }
    },
  );
};

export {
  GDDReferenceCard,
  GeoDeepDiveSwatch,
  GeoDeepDiveSwatchInnerBare,
  GeoDeepDiveRelatedTerms,
};

import { hyperStyled } from "@macrostrat/hyper";
import { useState } from "react";
import axios from "axios";
//@ts-ignore
import styles from "./pub.module.scss";
import {
  InputGroup,
  Button,
  Intent,
  Spinner,
  Tooltip,
} from "@blueprintjs/core";
import { Publication } from "./publication";
import { SubmitButton } from "../button";

const h = hyperStyled(styles);

function isLetter(char: string): boolean {
  if (char.toUpperCase() != char.toLowerCase()) {
    return true;
  } else {
    return false;
  }
}

export const isTitle = (search: string): boolean => {
  let i = 0;
  for (let char of search) {
    if (isLetter(char)) {
      i += 1;
    }
  }
  if (i / search.length > 0.7) {
    return true;
  } else {
    return false;
  }
};

const publicationMessage = (total: number | null) => {
  if (total == null) {
    return {
      message:
        "Search for a Paper by title (like/ fuzzy search) or DOI (exact)",
      intent: Intent.NONE,
      totalNumber: "?",
    };
  }
  if (total == 0) {
    return { message: "No results!", intent: Intent.DANGER, totalNumber: 0 };
  }
  if (total <= 5) {
    return {
      message: "Only 5 or less results!",
      intent: Intent.SUCCESS,
      totalNumber: total,
    };
  }
  if (total > 5 && total <= 10) {
    return {
      message: "More results than are shown, try to narrow your search",
      intent: Intent.WARNING,
      totalNumber: total,
    };
  } else {
    return {
      message:
        "Ouufff, looks like you have a lot of results. Try to narrow your search",
      intent: Intent.DANGER,
      totalNumber: "20+",
    };
  }
};

const unwrapPubData = (data: any) => {
  const title: string = data.title;
  const { identifier, author, year, link } = data;
  if (identifier) {
    const doi = identifier.map((ele: any) => {
      if (ele.type == "doi") {
        return ele.id;
      }
    });
    const link_ = link?.[0].url;

    return {
      doi: doi[0],
      title,
      author: author[0]?.name,
      year: parseInt(year),
      link: link_,
    };
  }
};

async function onSearch(
  query: string,
  setSearching: (e: boolean) => void,
  callback: (res: Pub[]) => void
) {
  setSearching(true);

  const xddRoute = "https://xdd.wisc.edu/api/articles";
  const xDDParams = isTitle(query)
    ? { title_like: query, max: 50 }
    : { doi: query, max: 20 };

  const xddRes = await axios.get(xddRoute, { params: { ...xDDParams } });

  const data = xddRes.data.success.data;
  const cleanedData = data.map((d: any) => unwrapPubData(d));
  callback(cleanedData);
  setSearching(false);
}

export interface Pub {
  author: string;
  year: number;
  title: string;
  doi: string;
  link: string;
}

export interface PubFinderI {
  onClick: (p: Pub) => void;
  tooltipModifiers?: object;
}

function PublicationFinder(props: PubFinderI) {
  const [query, setQuery] = useState<string>("");
  const [searching, setSearching] = useState(false);
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const { message, intent, totalNumber } = publicationMessage(total);

  const onSearch_ = (e: any) => {
    e.preventDefault();
    onSearch(query, setSearching, (pubs) => {
      setPubs(pubs);
      setTotal(pubs.length);
    });
  };

  const leftElement = h(
    Tooltip,
    {
      className: "tooltip-pub",
      content: message,
      intent,
      position: "top",
      modifiers: props.tooltipModifiers,
    },
    [h(Button, { intent }, [totalNumber])]
  );

  const rightElement = h(Button, {
    icon: "search",
    onClick: onSearch_,
    minimal: true,
  });

  return h("div", [
    h("form", { onSubmit: onSearch_ }, [
      h(InputGroup, {
        leftElement,
        rightElement,
        onChange: (e) => {
          setQuery(e.target.value);
        },
      }),
    ]),
    h.if(pubs.length == 0 && !searching)("div.pub-edit-card", [
      "Search for a Paper by title (like/ fuzzy search) or DOI (exact)",
    ]),
    h.if(searching)("div", { style: { marginTop: "20px" } }, [h(Spinner)]),
    h.if(pubs.length > 0 && !searching)("div.pub-results", [
      pubs.map((pub, i) => {
        const { doi, title } = pub;
        const onClick = () => {
          props.onClick(pub);
        };
        return h("div.pub-edit-card", { key: i }, [
          h(Publication, { doi, title }),
          h(SubmitButton, { onClick }),
        ]);
      }),
    ]),
    h.if(total == 0 && !searching)("div.pub-edit-card", ["No Results"]),
  ]);
}

export { PublicationFinder };

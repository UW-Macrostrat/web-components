import { useState, useEffect } from "react";
import axios from "axios";
import { hyperStyled } from "@macrostrat/hyper";
//@ts-ignore
import styles from "./taxa.module.scss";
import { Spinner } from "@blueprintjs/core";

const h = hyperStyled(styles);

const paleoUrl = "https://paleobiodb.org/data1.2/occs/prevalence.json";
const macrostratUrl = "https://macrostrat.org/api/v2/fossils";

async function fetchPrevalentTaxa(strat_name_id: number | string) {
  const res = await axios.get(macrostratUrl, {
    params: { strat_name_id: strat_name_id },
  });

  const collections = res.data.success.data.map(
    (c: { cltn_id: number }) => c.cltn_id,
  );
  if (collections.length > 0) {
    const paleoRes = await axios.get(paleoUrl, {
      params: { limit: 5, coll_id: collections.join(",") },
    });

    paleoRes.data.records.forEach((d: PrevalentTaxaResI) => {
      var splitName = d.nam.split(" ");
      d.nam = splitName[0] + (splitName.length > 1 ? "*" : "");
    });

    return paleoRes.data.records;
  }
  return [];
}

interface PrevalentTaxaResI {
  img: any;
  nam: string;
  noc: string;
  oid: string;
}

function PrevalentTaxa({ strat_name_id }: { strat_name_id: number | string }) {
  const [state, setState] = useState<PrevalentTaxaResI[]>();
  console.log(state);
  useEffect(() => {
    async function fetch() {
      const data = await fetchPrevalentTaxa(strat_name_id);
      setState(data);
    }
    fetch();
  }, [strat_name_id]);

  if (typeof state === "undefined") {
    return h(Spinner);
  }

  return h(`div.row .prevalent-taxa-row`, [
    h("div.prevalent-taxa-container", [
      h("div.prevalent-taxa", [
        h("p", { id: "prevalent-taxa-title" }, ["Prevalent taxa"]),
        h("p", [
          h("small", [
            "via ",
            h(
              "a.normalize-link",
              { href: "https://paleobiodb.org", target: "_blank" },
              ["PaleoBioDB"],
            ),
          ]),
        ]),
      ]),
    ]),
    state.map((d, i) => {
      return h("div.prevalent-taxa-container", { key: i }, [
        h("div.prevalent-taxa", [
          h("img", {
            src: d.img
              ? "https://paleobiodb.org/data1.2/taxa/thumb.png?id=" + d.img
              : "",
            title: d.nam + " (" + d.noc + " occurrences)",
          }),
          h("p", [
            h(
              "a.normalize-link",
              {
                href:
                  "https://paleobiodb.org/cgi-bin/bridge.pl?a=basicTaxonInfo&taxon_no=" +
                  d.oid,
                target: "_blank",
              },
              [d.nam],
            ),
          ]),
        ]),
      ]);
    }),
  ]);
}

export { PrevalentTaxa };

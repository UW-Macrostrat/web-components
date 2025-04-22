import hyper from "@macrostrat/hyper";
import { useAsyncMemo } from "@macrostrat/ui-components";
import styles from "./package-info.module.sass";

const h = hyper.styled(styles);

const workspaces = [
  "column-views",
  "map-interface",
  "ui-components",
  "column-components",
  "mapbox-react",
];

export function PackageIndex() {
  const packages = useAsyncMemo(() => {
    return Promise.all(
      workspaces.map((d) => {
        return import(`../packages/${d}/package.json`).then((d) => d.default);
      })
    );
  }, []);

  if (packages == null) {
    return null;
  }

  return h(
    "div.package-index",
    packages.map((d) => {
      return h(PackageLink, { data: d });
    })
  );
}

function PackageLink({ data }) {
  let href = data.repository.url;
  if (data.repository.directory) {
    href += "/tree/main/" + data.repository.directory;
  }

  return h("div.package-info", [
    h("h3", data.name),
    h("p", data.description),
    h("p.links", [
      "Links: ",
      h(
        "a",
        {
          href,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "GitHub"
      ),
      " | ",
      h(
        "a",
        {
          href: `https://www.npmjs.com/package/${data.name}`,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        "NPM"
      ),
    ]),
    h("p", ["Version ", h("code", data.version)]),
  ]);
}

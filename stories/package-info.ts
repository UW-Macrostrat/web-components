import h from "@macrostrat/hyper";

const packages = [
  "ui-components",
  "map-interface",
  "timescale",
  "api-types",
  "color-utils",
  "column-components",
  "column-creator",
  "column-views",
  "cross-section-utils",
  "data-components",
  "data-sheet",
  "feedback-components",
  "form-components",
  "map-styles",
  "mapbox-react",
  "mapbox-utils",
  "stratigraphy-utils",
  "style-system",
  "svg-map-components",
];

export function PackageInfo() {
  return h(
    "ul.package-info",
    packages.map((pkg) => {
      return h("li.package-info-item", [
        h("code.bp6-code.package-name", "@macrostrat/" + pkg),
        " ",
        h("span.links", [
          h(
            "a",
            {
              href: `https://github.com/UW-Macrostrat/web-components/blob/main/packages/${pkg}`,
              target: "_blank",
            },
            "Github",
          ),
          ", ",
          h(
            "a",
            {
              href: `https://npmjs.org/package/@macrostrat/${pkg}`,
              target: "_blank",
            },
            "NPM",
          ),
        ]),
      ]);
    }),
  );
}

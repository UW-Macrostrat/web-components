import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { Menu, MenuDivider, MenuItem, PopoverNext } from "@blueprintjs/core";
import { LoremIpsum } from "lorem-ipsum";
import { ReactNode, useState } from "react";
import {
  composeShorteners,
  dropAfter,
  dropParenthetical,
  dropPrefix,
  dropSuffix,
  PageHeader,
  PageHeaderButton,
  PageHeaderProps,
  shortenedForms,
  Shortener,
} from "../src";
import styles from "./page-header.stories.module.sass";

const h = hyper.styled(styles);

const lorem = new LoremIpsum({
  sentencesPerParagraph: { max: 8, min: 4 },
  wordsPerSentence: { max: 16, min: 4 },
});

const logoURL =
  "https://storage.macrostrat.org/assets/web/macrostrat-icons/macrostrat-icon.svg";

const root = { text: "Macrostrat", href: "#" };

const meta: Meta<typeof PageHeader> = {
  title: "UI components/Page header",
  component: PageHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Logo, breadcrumbs, title, identifier and actions, arranged as an " +
          "**expanded** block, a **compact** single row, or a **hybrid** that " +
          "starts expanded and collapses its title into the trail on scroll. " +
          "Every measurement is a `--page-header-*` custom property defaulting " +
          "to a Paleozoic `--pz-` token.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["expanded", "compact", "hybrid"],
    },
    width: { control: "inline-radio", options: ["full", "constrained"] },
    size: { control: "inline-radio", options: ["default", "small"] },
    sticky: { control: "boolean" },
    collapseActions: {
      control: "inline-radio",
      options: ["never", "narrow", "always"],
    },
    collapseActionsBelow: {
      description: "Bar width (px) below which `narrow` folds the actions.",
      control: { type: "range", min: 240, max: 1200, step: 20 },
    },
    title: { control: "text" },
    shortTitle: { control: "object" },
    prioritizeTitle: { control: "boolean" },
    shortenTitle: {
      control: "inline-radio",
      options: ["never", "narrow", "always"],
    },
    identifier: { control: "text" },
    logo: { control: false },
    actions: { control: false },
    actionsMenu: { control: false },
    breadcrumbs: { control: "object" },
    children: { control: false },
  },
  render: (args) => h(DemoPage, { width: args.width }, h(PageHeader, args)),
};

export default meta;

type Story = StoryObj<typeof PageHeader>;

type PlaygroundArgs = PageHeaderProps & { previewWidth: number };

/** All controls exposed, over a scrolling page. `previewWidth` narrows the
 * page itself, so width-dependent behaviour (`collapseActions: "narrow"`,
 * crumb collapse, label dropping) can be tried without resizing the window. */
export const Playground: StoryObj<PlaygroundArgs> = {
  argTypes: {
    previewWidth: {
      description: "Story only: width of the page the header sits in (px).",
      control: { type: "range", min: 240, max: 1400, step: 20 },
    },
  },
  render: ({ previewWidth, ...args }) =>
    h(
      "div.preview-frame",
      { style: { maxWidth: previewWidth } },
      h(DemoPage, { width: args.width }, h(PageHeader, args)),
    ),
  args: {
    previewWidth: 1400,
    variant: "hybrid",
    width: "constrained",
    sticky: false,
    collapseActions: "never",
    collapseActionsBelow: 640,
    shortenTitle: "narrow",
    shortTitle: ["Sierra Estrella", "Estrella"],
    prioritizeTitle: true,
    logo: h(MacrostratLogo),
    breadcrumbs: [root, { text: "Maps", href: "#" }],
    title: "Sierra Estrella, Arizona",
    identifier: "#3712",
    actions: h(MapActions),
  },
};

/** The lexicon index: logo, root crumb and a large title, nothing else. */
export const Expanded: Story = {
  args: {
    variant: "expanded",
    width: "constrained",
    logo: h(MacrostratLogo),
    breadcrumbs: [root],
    title: "Lexicon",
  },
};

/** A map's page: identifier set against the title, supporting text beneath. */
export const ExpandedWithIdentifier: Story = {
  args: {
    variant: "expanded",
    width: "constrained",
    logo: h(MacrostratLogo),
    breadcrumbs: [root, { text: "Maps", href: "#" }],
    title: "Sierra Estrella, Arizona",
    identifier: "#3712",
    children:
      "Geologic map of the Sierra Estrella, Maricopa County, Arizona. Scale 1:24,000.",
  },
};

/** The column list: one row, the title as the trail's current crumb. */
export const Compact: Story = {
  args: {
    variant: "compact",
    width: "full",
    logo: h(MacrostratLogo),
    breadcrumbs: [root],
    title: "Columns",
    actions: h(ColumnsActions),
  },
};

/** The same row, held at the top of the page while it scrolls beneath. */
export const CompactSticky: Story = {
  args: {
    ...Compact.args,
    sticky: true,
    width: "constrained",
  },
};

/** Expanded at rest; scroll down and the title moves into the trail. */
export const Hybrid: Story = {
  args: {
    variant: "hybrid",
    width: "constrained",
    logo: h(MacrostratLogo),
    breadcrumbs: [root, { text: "Maps", href: "#" }],
    title: "Sierra Estrella, Arizona",
    identifier: "#3712",
    actions: h(MapActions),
  },
};

/** The hybrid header at `size: "small"`, for a narrow panel beside a map. */
export const Small: Story = {
  args: {
    ...Hybrid.args,
    size: "small",
    width: "full",
  },
  render: (args) =>
    h("div.preview-frame", { style: { maxWidth: 420 } }, [
      h(DemoPage, { width: args.width }, h(PageHeader, args)),
    ]),
};

/** Full width for app-like pages; constrained to the content column for
 * reading pages. The bar's background (when sticky) always spans the page. */
export const Widths: Story = {
  render: () =>
    h(DemoPage, { width: "constrained" }, [
      h(PageHeader, {
        variant: "compact",
        width: "full",
        logo: h(MacrostratLogo),
        breadcrumbs: [root, { text: "Dev", href: "#" }],
        title: "Full width",
        actions: h(ColumnsActions),
      }),
      h(PageHeader, {
        variant: "compact",
        width: "constrained",
        logo: h(MacrostratLogo),
        breadcrumbs: [root, { text: "Dev", href: "#" }],
        title: "Constrained to the content column",
        actions: h(ColumnsActions),
      }),
      h(PageHeader, {
        variant: "expanded",
        width: "constrained",
        logo: h(MacrostratLogo),
        breadcrumbs: [root, { text: "Lexicon", href: "#" }],
        title: "Expanded, constrained",
      }),
    ]),
};

/** The pathological case: a deep trail and a wide view switcher. Each frame
 * is a fixed width and can also be dragged from its corner. Crumbs collapse
 * into "…" first (the root last); then, while the title still lacks room,
 * action labels drop, the inline identifier hides, and finally the title
 * truncates. The expanded header has no inline title, so it drops labels at
 * fixed bar widths. The last header opts in to `collapseActions: "narrow"`,
 * making the "more" dropdown the final step before the title gives. */
export const Overflow: Story = {
  render: () =>
    h(
      "div.width-frames",
      [960, 640, 480, 360, 280].map((width) =>
        h("div", { key: width }, [
          h("div.frame-label", `${width}px`),
          h("div.width-frame", { style: { width } }, [
            h(PageHeader, {
              variant: "compact",
              logo: h(MacrostratLogo),
              breadcrumbs: [
                root,
                { text: "Dev", href: "#" },
                { text: "Map", href: "#" },
              ],
              title: "Compilations",
              actions: h(ViewSwitcher, { initial: "Map and compilations" }),
            }),
            h(PageHeader, {
              variant: "compact",
              logo: h(MacrostratLogo),
              breadcrumbs: [root, { text: "Maps", href: "#" }],
              title:
                "Geologic map of the Sierra Estrella and adjacent ranges, Maricopa County, Arizona",
              identifier: "#3712",
              actions: h(MapActions),
            }),
            h(PageHeader, {
              variant: "expanded",
              logo: h(MacrostratLogo),
              breadcrumbs: [
                root,
                { text: "Lexicon", href: "#" },
                { text: "Stratigraphic names", href: "#" },
              ],
              title: "Tapeats Sandstone (Tonto Group)",
              identifier: "#1205",
              actions: h(MapActions),
            }),
            h(PageHeader, {
              variant: "compact",
              logo: h(MacrostratLogo),
              breadcrumbs: [root, { text: "Dev", href: "#" }],
              title: "Columns",
              actions: h(ColumnsActions),
              collapseActions: "narrow",
            }),
          ]),
        ]),
      ),
    ),
};

/** Opt-in super-compact actions: the whole right side folds behind one
 * "more" button. `always` here; `narrow` folds only below
 * `collapseActionsBelow`. By default the dropdown shows `actions` stacked with
 * full labels; `actionsMenu` replaces that with purpose-built content. */
export const FoldedActions: Story = {
  render: () =>
    h(DemoPage, { width: "constrained" }, [
      h(PageHeader, {
        variant: "compact",
        sticky: true,
        width: "constrained",
        logo: h(MacrostratLogo),
        breadcrumbs: [root],
        title: "Columns (actions stacked in the dropdown)",
        actions: h(ColumnsActions),
        collapseActions: "always",
      }),
      h(PageHeader, {
        variant: "compact",
        width: "constrained",
        logo: h(MacrostratLogo),
        breadcrumbs: [root, { text: "Maps", href: "#" }],
        title: "Sierra Estrella, Arizona (custom menu)",
        identifier: "#3712",
        actions: h(MapActions),
        collapseActions: "always",
        actionsMenu: h(Menu, [
          h(MenuItem, { icon: "download", text: "Download" }),
          h(MenuDivider, { title: "View" }),
          h(MenuItem, { icon: "map", text: "Map and legend", active: true }),
          h(MenuItem, { icon: "list", text: "List only" }),
          h(MenuItem, { icon: "map", text: "Map only" }),
        ]),
      }),
    ]),
};

/** A geologic-map title shortener built from the standard pieces: each step
 * works on the shortest form so far. */
const mapTitleShortener: Shortener = composeShorteners(
  dropPrefix("Geologic map of the", "Geologic map of"),
  dropAfter(","),
  dropParenthetical,
  dropSuffix("and adjacent ranges", "Formation", "Group"),
);

const longMapTitle =
  "Geologic map of the Sierra Estrella and adjacent ranges, Maricopa County, Arizona";

/** Inline titles can step down through shorter forms before truncating.
 * `shortTitle` takes one string, a list (longest first), or a shortener
 * function; `shortenTitle` says when: `narrow` (default) uses the longest form
 * that fits once crumbs have collapsed, `always` starts from the first short
 * form, `never` keeps the full title. Hover a shortened title for the full one.
 * The large expanded title is never shortened. */
export const ShortTitles: Story = {
  render: () =>
    h(
      "div.width-frames",
      [1100, 760, 520, 380].map((width) =>
        h("div", { key: width }, [
          h("div.frame-label", `${width}px`),
          h("div.width-frame", { style: { width } }, [
            h(ShortTitleRow, {
              label: "shortTitle: shortener function",
              title: longMapTitle,
              shortTitle: mapTitleShortener,
              identifier: "#3712",
            }),
            h(ShortTitleRow, {
              label: "shortTitle: list",
              title: "Tapeats Sandstone (Tonto Group)",
              shortTitle: ["Tapeats Sandstone", "Tapeats"],
              identifier: "#1205",
            }),
            h(ShortTitleRow, {
              label: "shortenTitle: always",
              title: "Sierra Estrella, Arizona",
              shortTitle: "Sierra Estrella",
              shortenTitle: "always",
            }),
            h(ShortTitleRow, {
              label: "shortenTitle: never",
              title: longMapTitle,
              shortTitle: mapTitleShortener,
              shortenTitle: "never",
              identifier: "#3712",
            }),
          ]),
        ]),
      ),
    ),
};

/** The inline title decides when secondary content goes (`prioritizeTitle`,
 * on by default). In each frame the first header opts out, dropping labels
 * and identifier at fixed bar widths (40rem, 26rem); the others step down as
 * soon as the title lacks room: labels, then identifier, then (with
 * `collapseActions`) the dropdown, and only then shorten or truncate the
 * title. A number sets how many ems of title to protect (default 20). */
export const TitleFirst: Story = {
  render: () =>
    h(
      "div.width-frames",
      [1000, 820, 680, 560, 440].map((width) =>
        h("div", { key: width }, [
          h("div.frame-label", `${width}px`),
          h("div.width-frame", { style: { width } }, [
            h(TitleFirstRow, {
              label: "prioritizeTitle: false (fixed widths)",
              prioritizeTitle: false,
            }),
            h(TitleFirstRow, { label: "default (title first)" }),
            h(TitleFirstRow, {
              label: 'collapseActions: "narrow"',
              collapseActions: "narrow",
            }),
          ]),
        ]),
      ),
    ),
};

function TitleFirstRow({
  label,
  ...props
}: Partial<PageHeaderProps> & { label: string }) {
  return h("div.short-title-row", [
    h("div.row-label", label),
    h(PageHeader, {
      variant: "compact",
      logo: h(MacrostratLogo),
      breadcrumbs: [root, { text: "Maps", href: "#" }],
      title: "Sierra Estrella and adjacent ranges, Arizona",
      shortTitle: ["Sierra Estrella and adjacent ranges", "Sierra Estrella"],
      identifier: "#3712",
      actions: h(ColumnsActions),
      ...props,
    }),
  ]);
}

/** What the standard shorteners produce, as `shortenedForms(title, shortener)`:
 * the full text, then each strictly shorter form. The same shape is meant for
 * other labels that must fit a measured space, such as column unit labels. */
export const Shorteners: Story = {
  render: () => {
    const cases: [string, string, Shortener][] = [
      ["composeShorteners(…)", longMapTitle, mapTitleShortener],
      [
        'dropAfter(",")',
        "Sierra Estrella, Maricopa County, Arizona",
        dropAfter(","),
      ],
      [
        "dropParenthetical",
        "Tapeats Sandstone (Tonto Group)",
        dropParenthetical,
      ],
      ['dropSuffix("Formation")', "Kaibab Formation", dropSuffix("Formation")],
      [
        'dropPrefix("Geologic map of the")',
        "Geologic map of the Grand Canyon",
        dropPrefix("Geologic map of the"),
      ],
    ];
    return h("div.width-frames", [
      h("table.shortener-table", [
        h(
          "thead",
          h("tr", [h("th", "Shortener"), h("th", "Forms, longest first")]),
        ),
        h(
          "tbody",
          cases.map(([name, text, shortener]) =>
            h("tr", { key: name }, [
              h("td", h("code", name)),
              h(
                "td",
                h(
                  "ol",
                  shortenedForms(text, shortener).map((form) =>
                    h("li", { key: form }, form),
                  ),
                ),
              ),
            ]),
          ),
        ),
      ]),
    ]);
  },
};

function ShortTitleRow({
  label,
  ...props
}: PageHeaderProps & { label: string }) {
  return h("div.short-title-row", [
    h("div.row-label", label),
    h(PageHeader, {
      variant: "compact",
      logo: h(MacrostratLogo),
      breadcrumbs: [root, { text: "Maps", href: "#" }],
      actions: h(PageHeaderButton, {
        icon: "download",
        variant: "minimal",
        text: "Download",
      }),
      ...props,
    }),
  ]);
}

/** The same components under a second brand, restyled only through tokens
 * on an ancestor: Rockd's logo, background, accent and title weight. */
export const SecondBrand: Story = {
  render: () =>
    h(
      "div.rockd-brand",
      h(DemoPage, { width: "constrained" }, [
        h(PageHeader, {
          variant: "hybrid",
          width: "constrained",
          logo: h(RockdLogo),
          breadcrumbs: [
            { text: "Rockd", href: "#" },
            { text: "Checkins", href: "#" },
          ],
          title: "Devils Tower, Wyoming",
          identifier: "#88213",
          actions: [
            h(PageHeaderButton, {
              icon: "share",
              variant: "minimal",
              text: "Share",
            }),
            h(PageHeaderButton, {
              icon: "user",
              intent: "primary",
              text: "Sign in",
            }),
          ],
        }),
      ]),
    ),
};

// Story helpers

function DemoPage({
  children,
  width = "constrained",
  paragraphs = 14,
}: {
  children: ReactNode;
  width?: PageHeaderProps["width"];
  paragraphs?: number;
}) {
  const [content] = useState(() => loremSections(paragraphs));
  return h("div.demo-page", [
    children,
    h("main.demo-content", { className: width }, content),
  ]);
}

function loremSections(nParagraphs: number) {
  const paragraphs = lorem.generateParagraphs(nParagraphs).split("\n");
  return paragraphs.map((text, i) => {
    if (i > 0 && i % 4 == 0) {
      return h("section", { key: i }, [
        h("h2", lorem.generateWords(3)),
        h("p", text),
      ]);
    }
    return h("p", { key: i }, text);
  });
}

function MacrostratLogo() {
  // Falls back to an inline stand-in where the asset host is unreachable
  // (e.g. a sandboxed static build).
  const [failed, setFailed] = useState(false);
  let mark: ReactNode = h("img", {
    src: logoURL,
    alt: "",
    onError: () => setFailed(true),
  });
  if (failed) {
    mark = h(StrataMark);
  }
  return h("a.demo-logo", { href: "#", "aria-label": "Macrostrat home" }, mark);
}

/** Rough stand-in for the Macrostrat icon: brand-colored strata. */
function StrataMark() {
  const bands = ["#b8c9e7", "#5b8bd9", "#a7e8cd", "#68ded4", "#7e66a9"];
  return h("svg", { viewBox: "0 0 32 32" }, [
    h("clipPath#strata-clip", h("rect", { width: 32, height: 32, rx: 8 })),
    h(
      "g",
      { clipPath: "url(#strata-clip)" },
      bands.map((fill, i) =>
        h("rect", { key: fill, y: i * 6.4, width: 32, height: 6.6, fill }),
      ),
    ),
  ]);
}

/** A stand-in mark for a second brand. */
function RockdLogo() {
  return h(
    "a.demo-logo",
    { href: "#", "aria-label": "Rockd home" },
    h("svg", { viewBox: "0 0 32 32" }, [
      h("rect", { width: 32, height: 32, rx: 8, fill: "#9a3412" }),
      h("path", { d: "M4 25 L13 9 L18 17 L21 13 L28 25 Z", fill: "#fdba74" }),
    ]),
  );
}

function ColumnsActions() {
  return h([
    h(PageHeaderButton, {
      icon: "user",
      intent: "success",
      href: "#",
      text: "Log out",
    }),
    h(ViewSwitcher, { initial: "List and map" }),
  ]);
}

function MapActions() {
  return h([
    h(PageHeaderButton, {
      icon: "download",
      variant: "minimal",
      text: "Download",
    }),
    h(ViewSwitcher, { initial: "Map and legend" }),
  ]);
}

const viewModes = {
  "List and map": "list-columns",
  "Map and compilations": "map",
  "Map and legend": "map",
  "List only": "list",
  "Map only": "map",
};

function ViewSwitcher({ initial }: { initial: string }) {
  const [mode, setMode] = useState(initial);
  const options = [initial, "List only", "Map only"];
  const menu = h(
    Menu,
    options.map((option) =>
      h(MenuItem, {
        key: option,
        text: option,
        icon: viewModes[option],
        active: option == mode,
        onClick: () => setMode(option),
      }),
    ),
  );
  return h(
    PopoverNext,
    { content: menu, placement: "bottom-end" },
    h(PageHeaderButton, {
      variant: "minimal",
      icon: viewModes[mode],
      endIcon: "caret-down",
      text: mode,
    }),
  );
}

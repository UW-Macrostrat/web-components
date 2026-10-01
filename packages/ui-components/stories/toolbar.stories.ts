import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import {
  HTMLSelect,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
} from "@blueprintjs/core";
import { LoremIpsum } from "lorem-ipsum";
import classNames from "classnames";
import { ReactNode, useState } from "react";
import {
  FilterTag,
  MenuFormItem,
  PageHeader,
  Toolbar,
  ToolbarButton,
  ToolbarItem,
  ToolbarProps,
} from "../src";
import styles from "./toolbar.stories.module.sass";

const h = hyper.styled(styles);

const lorem = new LoremIpsum({
  sentencesPerParagraph: { max: 7, min: 4 },
  wordsPerSentence: { max: 16, min: 4 },
});

const meta: Meta<typeof Toolbar> = {
  title: "UI components/Toolbar",
  component: Toolbar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A bar of controls for any page or content model. It owns layout " +
          "only: **placement** (inline, sticky, floating, fixed), **surface** " +
          "(plain, bordered, raised) and how it sheds width (**collapse**: " +
          "labels drop to icons, then items fold into a popover, lowest " +
          "priority first). State stays with the page — these stories keep it " +
          "in plain React state. `FilterTag`, `ToolbarDropdown` and " +
          "`MenuFormItem` give filters and sorts one look everywhere.",
      },
    },
  },
};

export default meta;

type PlaygroundArgs = ToolbarProps & { previewWidth: number };

/** Every layout option over a scrolling stage (the stage is the scroll
 * container and the positioned ancestor, so `sticky` and `floating` show
 * against it; `fixed` uses the viewport). `previewWidth` narrows the stage to
 * try collapsing. */
export const Playground: StoryObj<PlaygroundArgs> = {
  argTypes: {
    placement: {
      control: "inline-radio",
      options: ["inline", "sticky", "floating", "fixed"],
    },
    anchor: { control: "inline-radio", options: ["top", "bottom"] },
    align: {
      control: "inline-radio",
      options: ["stretch", "start", "center", "end"],
    },
    surface: {
      control: "inline-radio",
      options: ["plain", "bordered", "raised"],
    },
    size: { control: "inline-radio", options: ["regular", "small"] },
    collapse: {
      control: "inline-radio",
      options: ["never", "narrow", "always"],
    },
    overflowLabel: { control: "text" },
    previewWidth: {
      description: "Story only: width of the stage (px).",
      control: { type: "range", min: 240, max: 1400, step: 20 },
    },
  },
  args: {
    placement: "sticky",
    anchor: "top",
    surface: "bordered",
    size: "regular",
    collapse: "narrow",
    overflowLabel: "",
    previewWidth: 1400,
  },
  render: ({ previewWidth, overflowLabel, ...args }) =>
    h("div.stage", { style: { maxWidth: previewWidth } }, [
      h(DemoToolbar, {
        ...args,
        overflowLabel: overflowLabel || undefined,
      }),
      h(StageContent),
    ]),
};

/** The four placements. Inline sits in the flow; sticky holds the top of its
 * scroll container; floating lifts over a positioned ancestor (here a map
 * stand-in) and leaves it usable around the bar; fixed lifts over the
 * viewport (bottom-anchored here, clear of the phone's safe area). */
export const Placements: StoryObj = {
  render: () =>
    h("div.placements", [
      h(Labelled, { label: 'placement: "inline", surface: "bordered"' }, [
        h("div.stage.short", [
          h(DemoToolbar, { placement: "inline", surface: "bordered" }),
          h(StageContent, { paragraphs: 2 }),
        ]),
      ]),
      h(Labelled, { label: 'placement: "sticky" (scroll the stage)' }, [
        h("div.stage.short", [
          h(DemoToolbar, { placement: "sticky", surface: "bordered" }),
          h(StageContent, { paragraphs: 6 }),
        ]),
      ]),
      h(Labelled, { label: 'placement: "floating", align: "start"' }, [
        h("div.stage.short.map-stage", [
          h(DemoToolbar, {
            placement: "floating",
            align: "start",
            collapse: "narrow",
          }),
        ]),
      ]),
      h(
        Labelled,
        { label: 'placement: "fixed", anchor: "bottom" (see the window)' },
        h(Toolbar, {
          placement: "fixed",
          anchor: "bottom",
          start: [
            {
              id: "selected",
              pinned: true,
              content: h(FilterTag, { icon: "selection" }, "3 selected"),
            },
          ],
          end: [
            {
              id: "export",
              content: h(ToolbarButton, {
                icon: "export",
                variant: "minimal",
                text: "Export",
              }),
            },
            {
              id: "clear",
              content: h(ToolbarButton, {
                icon: "cross",
                variant: "minimal",
                text: "Clear",
              }),
            },
          ],
        }),
      ),
    ]),
};

/** `collapse: "narrow"` at fixed widths (each frame drags wider or
 * narrower). The bar drops labels to icons first, then folds items into the
 * popover from lowest priority: here Download, then Sort, then Age; the
 * search field and the Lithology filter are pinned. The last frames show
 * `collapse: "always"` and a labelled overflow button. */
export const Collapse: StoryObj = {
  render: () =>
    h("div.width-frames", [
      ...[1000, 720, 560, 440, 340].map((width) =>
        h(Labelled, { key: width, label: `${width}px` }, [
          h(
            "div.width-frame",
            { style: { width } },
            h(DemoToolbar, { collapse: "narrow", surface: "bordered" }),
          ),
        ]),
      ),
      h(Labelled, { label: 'collapse: "always", overflowLabel: "Filters"' }, [
        h(
          "div.width-frame",
          { style: { width: 720 } },
          h(DemoToolbar, {
            collapse: "always",
            overflowLabel: "Filters",
            overflowIcon: "filter-list",
            surface: "bordered",
          }),
        ),
      ]),
    ]),
};

/** A compact sticky page header with a sticky filter bar held beneath it,
 * via `--toolbar-offset` (the header bar's height). */
export const UnderPageHeader: StoryObj = {
  render: () =>
    h("div.page", [
      h(PageHeader, {
        variant: "compact",
        sticky: true,
        width: "full",
        logo: h(StrataMark),
        breadcrumbs: [
          { text: "Macrostrat", href: "#" },
          { text: "Lexicon", href: "#" },
        ],
        title: "Stratigraphic names",
        actions: h(ToolbarButton, {
          icon: "map",
          variant: "minimal",
          text: "Map",
        }),
      }),
      h(DemoToolbar, {
        placement: "sticky",
        surface: "bordered",
        collapse: "narrow",
        className: "under-header",
      }),
      h(StageContent, { paragraphs: 14 }),
    ]),
};

/** The tag that stands for a filter, sort or view control: a caret while it
 * opens something; the primary intent and a ✕ once in effect; a plain label
 * when it opens nothing. `MenuFormItem` puts a whole form inside a menu, one
 * click away instead of a submenu's two. */
export const FilterTags: StoryObj = {
  render: () => {
    const [age, setAge] = useState("Any");
    return h("div.tag-gallery", [
      h(Labelled, { label: "inactive (opens a menu)" }, [
        h(
          FilterTag,
          { icon: "filter", content: h(Menu, [h(MenuItem, { text: "…" })]) },
          "Filter",
        ),
      ]),
      h(Labelled, { label: "active, clearable" }, [
        h(
          FilterTag,
          {
            icon: "sort-asc",
            active: true,
            onClear: () => {},
            content: h(Menu, [h(MenuItem, { text: "Descending" })]),
          },
          "Name: ascending",
        ),
      ]),
      h(Labelled, { label: "no dropdown" }, [
        h(FilterTag, { icon: "tag" }, "12 results"),
      ]),
      h(Labelled, { label: "MenuFormItem in a dropdown" }, [
        h(
          FilterTag,
          {
            icon: "time",
            active: age != "Any",
            onClear: () => setAge("Any"),
            content: h(Menu, [
              h(MenuFormItem, { title: "Age" }, [
                h(HTMLSelect, {
                  value: age,
                  options: ages,
                  onChange: (e) => setAge(e.target.value),
                  fill: true,
                }),
              ]),
            ]),
          },
          labelFor("Age", age),
        ),
      ]),
    ]);
  },
};

// A demo content model: lexicon-like filters in plain React state.

const lithologies = ["Sandstone", "Shale", "Limestone", "Dolomite", "Basalt"];
const ages = ["Any", "Cenozoic", "Mesozoic", "Paleozoic", "Precambrian"];
const sortFields = ["Name", "Age", "Thickness"];

function DemoToolbar(props: Partial<ToolbarProps>) {
  const [search, setSearch] = useState("");
  const [liths, setLiths] = useState<string[]>([]);
  const [age, setAge] = useState("Any");
  const [sort, setSort] = useState<{ field: string; asc: boolean } | null>(
    null,
  );

  const toggleLith = (lith: string) => {
    if (liths.includes(lith)) {
      setLiths(liths.filter((l) => l != lith));
    } else {
      setLiths([...liths, lith]);
    }
  };

  const lithologyTag = h(
    FilterTag,
    {
      icon: "layers",
      active: liths.length > 0,
      onClear: () => setLiths([]),
      content: h(
        Menu,
        lithologies.map((lith) =>
          h(MenuItem, {
            key: lith,
            text: lith,
            icon: liths.includes(lith) ? "tick" : "blank",
            shouldDismissPopover: false,
            onClick: () => toggleLith(lith),
          }),
        ),
      ),
    },
    labelFor("Lithology", liths.join(", ") || "Any"),
  );

  const ageTag = h(
    FilterTag,
    {
      icon: "time",
      active: age != "Any",
      onClear: () => setAge("Any"),
      content: h(Menu, [
        h(MenuFormItem, { title: "Age" }, [
          h(HTMLSelect, {
            value: age,
            options: ages,
            onChange: (e) => setAge(e.target.value),
            fill: true,
          }),
        ]),
      ]),
    },
    labelFor("Age", age),
  );

  let sortLabel = "Sort";
  let sortIcon: any = "sort";
  if (sort != null) {
    sortLabel = `${sort.field}: ${sort.asc ? "ascending" : "descending"}`;
    sortIcon = sort.asc ? "sort-asc" : "sort-desc";
  }
  const sortTag = h(
    FilterTag,
    {
      icon: sortIcon,
      active: sort != null,
      onClear: () => setSort(null),
      content: h(Menu, [
        h(MenuDivider, { title: "Sort by" }),
        ...sortFields.map((field) =>
          h(MenuItem, {
            key: field,
            text: field,
            active: sort?.field == field,
            icon: iconForSort(sort, field),
            shouldDismissPopover: false,
            onClick: () =>
              setSort({ field, asc: !(sort?.field == field && sort.asc) }),
          }),
        ),
      ]),
    },
    sortLabel,
  );

  const start: ToolbarItem[] = [
    { id: "lithology", content: lithologyTag, pinned: true },
    { id: "age", content: ageTag, priority: 2 },
    { id: "sort", content: sortTag, priority: 1 },
  ];
  const end: ToolbarItem[] = [
    {
      id: "download",
      priority: 0,
      content: h(ToolbarButton, {
        icon: "download",
        variant: "minimal",
        text: "Download",
      }),
    },
  ];

  return h(
    Toolbar,
    {
      start,
      end,
      ...props,
      className: classNames("demo-toolbar", props.className),
    },
    h(InputGroup, {
      className: "search",
      leftIcon: "search",
      placeholder: "Search names",
      value: search,
      onChange: (e) => setSearch(e.target.value),
      small: props.size == "small",
    }),
  );
}

function labelFor(name: string, value: string) {
  if (value == "Any") return name;
  return h([h("span.tag-subject", `${name}: `), value]);
}

function iconForSort(sort: { field: string; asc: boolean } | null, field) {
  if (sort == null || sort.field != field) return "blank";
  if (sort.asc) return "sort-asc";
  return "sort-desc";
}

function StageContent({ paragraphs = 10 }: { paragraphs?: number }) {
  const [content] = useState(() =>
    lorem
      .generateParagraphs(paragraphs)
      .split("\n")
      .map((text, i) => h("p", { key: i }, text)),
  );
  return h("div.stage-content", content);
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return h("div.labelled", [h("div.frame-label", label), children]);
}

function StrataMark() {
  const bands = ["#b8c9e7", "#5b8bd9", "#a7e8cd", "#68ded4", "#7e66a9"];
  return h(
    "a.demo-logo",
    { href: "#", "aria-label": "Macrostrat home" },
    h("svg", { viewBox: "0 0 32 32" }, [
      h(
        "clipPath#toolbar-strata-clip",
        h("rect", { width: 32, height: 32, rx: 8 }),
      ),
      h(
        "g",
        { clipPath: "url(#toolbar-strata-clip)" },
        bands.map((fill, i) =>
          h("rect", { key: fill, y: i * 6.4, width: 32, height: 6.6, fill }),
        ),
      ),
    ]),
  );
}

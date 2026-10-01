import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import {
  ButtonGroup,
  HTMLSelect,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
  TagInput,
} from "@blueprintjs/core";
import classNames from "classnames";
import { LoremIpsum } from "lorem-ipsum";
import { ReactNode, useState } from "react";
import {
  FilterTag,
  MenuFormItem,
  PageHeader,
  Toolbar,
  ToolbarButton,
  ToolbarItem,
  ToolbarProps,
  useToolbarDensity,
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
          "(plain, bordered, raised), **density** (expanded, compact, " +
          "collapsed) and how it adapts down from there as it narrows " +
          "(**collapse**: labels drop to icons, then items fold into a " +
          "popover by priority, while growing fields such as search shrink " +
          "in step). State stays with the page — these stories keep it in " +
          "plain React state. `FilterTag`, `ToolbarButton`, `ToolbarDropdown` " +
          "and `MenuFormItem` give filters, sorts and actions one look " +
          "everywhere, sized to the bar's density.",
      },
    },
  },
};

export default meta;

/** The demo's content-model knobs (story only). */
interface DemoOptions {
  /** Where the search field sits among the filters. */
  layout?: "filters-first" | "search-first";
  /** A plain search field, one holding the filters as tags, or none. */
  search?: "input" | "tags" | "none";
  withFilters?: boolean;
  withSort?: boolean;
  /** Start with filters and a sort in effect. */
  prefilled?: boolean;
  buttons?: "none" | "download" | "many";
}

type PlaygroundArgs = ToolbarProps & DemoOptions & { previewWidth: number };

/** Every layout and content option over a scrolling stage (the stage is the
 * scroll container and positioned ancestor, so `sticky` and `floating` show
 * against it; `fixed` uses the viewport). `previewWidth` narrows the stage. */
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
    density: {
      control: "inline-radio",
      options: ["expanded", "compact", "collapsed"],
    },
    collapse: { control: "inline-radio", options: ["narrow", "never"] },
    overflowLabel: { control: "text" },
    layout: {
      description: "Story only: where search sits.",
      control: "inline-radio",
      options: ["filters-first", "search-first"],
    },
    search: {
      description: "Story only: plain search, unified tag search, or none.",
      control: "inline-radio",
      options: ["input", "tags", "none"],
    },
    withFilters: { description: "Story only.", control: "boolean" },
    withSort: { description: "Story only.", control: "boolean" },
    prefilled: { description: "Story only.", control: "boolean" },
    buttons: {
      description: "Story only.",
      control: "inline-radio",
      options: ["none", "download", "many"],
    },
    previewWidth: {
      description: "Story only: width of the stage (px).",
      control: { type: "range", min: 240, max: 1400, step: 20 },
    },
  },
  args: {
    placement: "sticky",
    anchor: "top",
    surface: "bordered",
    density: "expanded",
    collapse: "narrow",
    overflowLabel: "",
    layout: "filters-first",
    search: "input",
    withFilters: true,
    withSort: true,
    prefilled: false,
    buttons: "download",
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

/** The same bar across content models, each at a fixed width (drag a frame's
 * corner to resize it). */
export const Variants: StoryObj = {
  render: () =>
    h("div.width-frames", [
      h(Frame, { label: "filters, search, sort, an action (default)" }, [
        h(DemoToolbar, {}),
      ]),
      h(Frame, { label: "search first, then filters and sort" }, [
        h(DemoToolbar, { layout: "search-first" }),
      ]),
      h(Frame, { label: "without sorting" }, [
        h(DemoToolbar, { withSort: false }),
      ]),
      h(Frame, { label: "pre-filled: filters and a sort in effect" }, [
        h(DemoToolbar, { prefilled: true }),
      ]),
      h(Frame, { label: "arbitrary buttons: a view switcher and actions" }, [
        h(DemoToolbar, { withSort: false, buttons: "many" }),
      ]),
      h(
        Frame,
        { label: "unified filter/search: filters as tags in a TagInput" },
        [h(DemoToolbar, { search: "tags", prefilled: true })],
      ),
      h(Frame, { label: "search and actions only" }, [
        h(DemoToolbar, {
          withFilters: false,
          withSort: false,
          buttons: "many",
        }),
      ]),
      h(Frame, { label: "filters and sort, no search" }, [
        h(DemoToolbar, { search: "none", prefilled: true }),
      ]),
    ]),
};

/** `density` sets the most room the contents take: `expanded` (full-size
 * tags, labelled buttons), `compact` (smaller tags, icon buttons, a shorter
 * bar — a page header's actions), `collapsed` (compact, with everything
 * foldable in the popover). With `collapse: "narrow"` the bar still adapts
 * down from there; each density shows a wide and a narrow frame. */
export const Densities: StoryObj = {
  render: () =>
    h(
      "div.width-frames",
      (["expanded", "compact", "collapsed"] as const).flatMap((density) =>
        [900, 520].map((width) =>
          h(
            Frame,
            {
              key: `${density}-${width}`,
              label: `density: "${density}", ${width}px`,
              width,
            },
            h(DemoToolbar, { density, prefilled: true }),
          ),
        ),
      ),
    ),
};

/** `collapse: "narrow"` at fixed widths (each frame drags wider or
 * narrower). The search field and the items give way in turn rather than
 * one at the other's expense: the field shrinks a step from its ideal width,
 * labels drop to icons, it shrinks another step, an item folds (Download,
 * then Sort, then Age; Lithology is pinned), and so on down to its minimum.
 * The last frame opts out with `collapse: "never"`. */
export const Collapse: StoryObj = {
  render: () =>
    h("div.width-frames", [
      ...[1100, 900, 760, 640, 540, 440, 340].map((width) =>
        h(
          Frame,
          { key: width, label: `${width}px`, width },
          h(DemoToolbar, {}),
        ),
      ),
      h(
        Frame,
        { label: 'collapse: "never", 640px', width: 640 },
        h(DemoToolbar, { collapse: "never" }),
      ),
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
      h(
        Labelled,
        {
          label: 'placement: "floating", align: "start", density: "compact"',
        },
        [
          h("div.stage.short.map-stage", [
            h(DemoToolbar, {
              placement: "floating",
              align: "start",
              density: "compact",
              buttons: "none",
            }),
          ]),
        ],
      ),
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

/** A page header's actions as a compact toolbar (`collapse: "never"`, so the
 * header's own title-first adaptation decides when its labels drop), with a
 * sticky filter bar held beneath the header via `--toolbar-offset`. */
export const WithPageHeader: StoryObj = {
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
        actions: h(Toolbar, {
          density: "compact",
          collapse: "never",
          start: [
            { id: "views", content: h(ViewSwitcher) },
            {
              id: "download",
              content: h(ToolbarButton, {
                icon: "download",
                variant: "minimal",
                text: "Download",
              }),
            },
          ],
        }),
      }),
      h(DemoToolbar, {
        placement: "sticky",
        surface: "bordered",
        className: "under-header",
        prefilled: true,
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

type Sort = { field: string; asc: boolean } | null;

function useDemoState(prefilled: boolean) {
  const [search, setSearch] = useState("");
  const [terms, setTerms] = useState<string[]>(prefilled ? ["Tonto"] : []);
  const [liths, setLiths] = useState<string[]>(prefilled ? ["Sandstone"] : []);
  const [age, setAge] = useState(prefilled ? "Paleozoic" : "Any");
  const [sort, setSort] = useState<Sort>(
    prefilled ? { field: "Name", asc: true } : null,
  );
  const toggleLith = (lith: string) => {
    if (liths.includes(lith)) {
      setLiths(liths.filter((l) => l != lith));
    } else {
      setLiths([...liths, lith]);
    }
  };
  return {
    search,
    setSearch,
    terms,
    setTerms,
    liths,
    setLiths,
    toggleLith,
    age,
    setAge,
    sort,
    setSort,
  };
}

type DemoState = ReturnType<typeof useDemoState>;

function DemoToolbar(props: Partial<ToolbarProps> & DemoOptions) {
  const {
    layout = "filters-first",
    search = "input",
    withFilters = true,
    withSort = true,
    prefilled = false,
    buttons = "download",
    className,
    ...toolbarProps
  } = props;
  const state = useDemoState(prefilled);

  const filterItems: ToolbarItem[] = [];
  // A unified search holds the filters itself.
  if (withFilters && search != "tags") {
    filterItems.push(
      { id: "lithology", pinned: true, content: h(LithologyTag, { state }) },
      { id: "age", priority: 2, content: h(AgeTag, { state }) },
    );
  }

  const searchItems: ToolbarItem[] = [];
  if (search == "input") {
    searchItems.push({
      id: "search",
      grow: true,
      content: h(SearchField, { state }),
    });
  } else if (search == "tags") {
    searchItems.push({
      id: "search",
      grow: true,
      content: h(UnifiedSearch, { state, withFilters }),
    });
  }

  const sortItems: ToolbarItem[] = [];
  if (withSort) {
    sortItems.push({
      id: "sort",
      priority: 1,
      content: h(SortTag, { state }),
    });
  }

  let start: ToolbarItem[] = [...filterItems, ...searchItems, ...sortItems];
  if (layout == "search-first") {
    start = [...searchItems, ...filterItems, ...sortItems];
  }

  return h(Toolbar, {
    start,
    end: buttonItems(buttons),
    ...toolbarProps,
    className: classNames("demo-toolbar", className),
  });
}

function buttonItems(buttons: DemoOptions["buttons"]): ToolbarItem[] {
  const download: ToolbarItem = {
    id: "download",
    priority: 0,
    content: h(ToolbarButton, {
      icon: "download",
      variant: "minimal",
      text: "Download",
    }),
  };
  if (buttons == "none") return [];
  if (buttons == "download") return [download];
  return [
    { id: "views", priority: 3, content: h(ViewSwitcher) },
    {
      id: "settings",
      priority: -1,
      content: h(ToolbarButton, {
        icon: "cog",
        variant: "minimal",
        text: "Settings",
      }),
    },
    download,
    {
      id: "new",
      pinned: true,
      content: h(ToolbarButton, {
        icon: "add",
        intent: "primary",
        text: "New name",
      }),
    },
  ];
}

function SearchField({ state }: { state: DemoState }) {
  const density = useToolbarDensity();
  return h(InputGroup, {
    className: "search",
    leftIcon: "search",
    placeholder: "Search names",
    value: state.search,
    onChange: (e) => state.setSearch(e.target.value),
    small: density == "compact",
    fill: true,
  });
}

/**
 * One field for search and filters: active filters are tags in the input,
 * free text becomes search terms, and `lith:` / `age:` prefixes add filters
 * from the keyboard. The filter menu at its end adds them by pointer.
 */
function UnifiedSearch({
  state,
  withFilters,
}: {
  state: DemoState;
  withFilters: boolean;
}) {
  const [input, setInput] = useState("");

  type Entry = { kind: "lith" | "age" | "term"; value: string };
  const entries: Entry[] = [];
  for (const value of state.liths) entries.push({ kind: "lith", value });
  if (state.age != "Any") entries.push({ kind: "age", value: state.age });
  for (const value of state.terms) entries.push({ kind: "term", value });

  const values = entries.map((entry) => {
    if (entry.kind == "term") return `“${entry.value}”`;
    let subject = "Age";
    if (entry.kind == "lith") subject = "Lithology";
    return h([h("span.tag-subject", `${subject}: `), entry.value]);
  });

  const add = (raw: string) => {
    const text = raw.trim();
    if (text == "") return;
    const [prefix, ...rest] = text.split(":");
    const value = rest.join(":").trim().toLowerCase();
    if (rest.length > 0 && prefix.toLowerCase() == "lith") {
      const match = lithologies.find((l) => l.toLowerCase().startsWith(value));
      if (match != null && !state.liths.includes(match)) {
        state.setLiths([...state.liths, match]);
        return;
      }
    }
    if (rest.length > 0 && prefix.toLowerCase() == "age") {
      const match = ages.find((a) => a.toLowerCase().startsWith(value));
      if (match != null) {
        state.setAge(match);
        return;
      }
    }
    state.setTerms([...state.terms, text]);
  };

  const remove = (index: number) => {
    const entry = entries[index];
    if (entry.kind == "lith") {
      state.setLiths(state.liths.filter((l) => l != entry.value));
    } else if (entry.kind == "age") {
      state.setAge("Any");
    } else {
      state.setTerms(state.terms.filter((t) => t != entry.value));
    }
  };

  let rightElement: ReactNode = undefined;
  if (withFilters) {
    rightElement = h(
      FilterTag,
      {
        icon: "filter-list",
        large: false,
        "aria-label": "Add a filter",
        content: h(Menu, [
          h(MenuDivider, { title: "Lithology" }),
          ...lithologies.map((lith) =>
            h(MenuItem, {
              key: lith,
              text: lith,
              icon: state.liths.includes(lith) ? "tick" : "blank",
              shouldDismissPopover: false,
              onClick: () => state.toggleLith(lith),
            }),
          ),
          h(MenuDivider, { title: "Age" }),
          ...ages.slice(1).map((age) =>
            h(MenuItem, {
              key: age,
              text: age,
              icon: state.age == age ? "tick" : "blank",
              onClick: () => state.setAge(state.age == age ? "Any" : age),
            }),
          ),
        ]),
      },
      "Filter",
    );
  }

  return h(TagInput, {
    className: "unified-search",
    leftIcon: "search",
    placeholder: 'Search, or "lith:" / "age:" to filter',
    values,
    inputValue: input,
    onInputChange: (e) => setInput((e.target as HTMLInputElement).value),
    onAdd: (added) => {
      added.forEach(add);
      setInput("");
    },
    onRemove: (_, index) => remove(index),
    tagProps: (_, index) => ({
      minimal: true,
      intent: entries[index]?.kind == "term" ? "none" : "primary",
    }),
    addOnBlur: false,
    separator: false,
    rightElement,
    fill: true,
  });
}

function LithologyTag({ state }: { state: DemoState }) {
  return h(
    FilterTag,
    {
      icon: "layers",
      active: state.liths.length > 0,
      onClear: () => state.setLiths([]),
      content: h(
        Menu,
        lithologies.map((lith) =>
          h(MenuItem, {
            key: lith,
            text: lith,
            icon: state.liths.includes(lith) ? "tick" : "blank",
            shouldDismissPopover: false,
            onClick: () => state.toggleLith(lith),
          }),
        ),
      ),
    },
    labelFor("Lithology", state.liths.join(", ") || "Any"),
  );
}

function AgeTag({ state }: { state: DemoState }) {
  return h(
    FilterTag,
    {
      icon: "time",
      active: state.age != "Any",
      onClear: () => state.setAge("Any"),
      content: h(Menu, [
        h(MenuFormItem, { title: "Age" }, [
          h(HTMLSelect, {
            value: state.age,
            options: ages,
            onChange: (e) => state.setAge(e.target.value),
            fill: true,
          }),
        ]),
      ]),
    },
    labelFor("Age", state.age),
  );
}

function SortTag({ state }: { state: DemoState }) {
  const { sort, setSort } = state;
  let sortLabel: ReactNode = "Sort";
  let sortIcon: any = "sort";
  if (sort != null) {
    sortLabel = labelFor(sort.field, sort.asc ? "ascending" : "descending");
    sortIcon = sort.asc ? "sort-asc" : "sort-desc";
  }
  return h(
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
}

function ViewSwitcher() {
  const [view, setView] = useState("list");
  const option = (id: string, icon: any, text: string) =>
    h(ToolbarButton, {
      key: id,
      icon,
      text,
      variant: "minimal",
      active: view == id,
      onClick: () => setView(id),
    });
  return h(ButtonGroup, [
    option("list", "list", "List"),
    option("map", "map", "Map"),
  ]);
}

function labelFor(name: string, value: string) {
  if (value == "Any") return name;
  return h([h("span.tag-subject", `${name}: `), value]);
}

function iconForSort(sort: Sort, field: string) {
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

function Frame({
  label,
  width = 900,
  children,
}: {
  label: string;
  width?: number;
  children: ReactNode;
}) {
  return h(Labelled, { label }, [
    h("div.width-frame", { style: { width } }, children),
  ]);
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

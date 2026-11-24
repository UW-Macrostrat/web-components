import type { Meta, StoryObj } from "@storybook/react-vite";
import hyper from "@macrostrat/hyper";
import { Navbar, Tag } from "@blueprintjs/core";
import { PageHeaderButton } from "@macrostrat/ui-components";
import { ReactNode } from "react";
import {
  Link,
  PageBreadcrumbs,
  PageBreadcrumbsProps,
  SitePageHeader,
  SitePageHeaderProps,
  SiteNavigationConfig,
} from "../src";
import {
  macrostrat,
  macrostratRoutes,
  MockPageOptions,
  MockSite,
  rockd,
  rockdRoutes,
} from "./mock-site";
import styles from "./navigation.stories.module.sass";

const h = hyper.styled(styles);

interface Scenario {
  name: string;
  /** What the scenario shows, for the contact sheet's caption. */
  note: string;
  page: MockPageOptions;
  site?: SiteNavigationConfig;
  header?: SitePageHeaderProps;
  /** Render `PageBreadcrumbs` in a container instead of a page header. */
  breadcrumbs?: PageBreadcrumbsProps;
  container?: "page" | "navbar" | "panel";
  /** Frame width in px; defaults to a desktop column. */
  width?: number;
}

function ColumnActions() {
  return h([
    h(PageHeaderButton, { icon: "edit", variant: "minimal", text: "Edit" }),
    h(PageHeaderButton, {
      icon: "comparison",
      variant: "minimal",
      text: "Correlate",
    }),
  ]);
}

const macrostratPage = (url: string, extra: Partial<MockPageOptions> = {}) => ({
  url,
  routes: macrostratRoutes,
  ...extra,
});

const scenarios: Scenario[] = [
  {
    name: "Section page",
    note: "Static routes: each crumb is the `pageInfo.name` of the page at that URL.",
    page: macrostratPage("/about/people"),
  },
  {
    name: "Record with identifier",
    note: "A `pageInfo` function of the route params: a component title, and an identifier beside it.",
    page: macrostratPage("/lex/strat-names/1205"),
  },
  {
    name: "Long title, compact",
    note: "On a single row the title gives way to `name`, its short form, before it truncates.",
    page: macrostratPage("/maps/5012"),
    header: { variant: "compact" },
    width: 460,
  },
  {
    name: "Long title, expanded",
    note: "The large title always shows the full `title`.",
    page: macrostratPage("/maps/5012"),
  },
  {
    name: "Deep trail, narrow",
    note: "Middle crumbs fold into the “…” menu; the root crumb goes last, behind the logo.",
    page: macrostratPage("/columns/432/edit/units/8810"),
    header: { variant: "compact" },
    width: 380,
  },
  {
    name: "Deep trail, wide",
    note: "The same route with room for every crumb.",
    page: macrostratPage("/columns/432/edit/units/8810"),
    header: { variant: "compact" },
    width: 900,
  },
  {
    name: "Labels from slugs",
    note: "One `pageInfo` serving a whole subtree (`/docs/*`) names each crumb from its URL slug.",
    page: macrostratPage("/docs/website/map/usage"),
  },
  {
    name: "No server trail",
    note: "Without `pageContext.breadcrumbs` (a client-side abort), the trail falls back to the URL's segments.",
    page: macrostratPage("/dev/map/rasters/emit-minerals", {
      withoutServerTrail: true,
    }),
    header: { variant: "compact" },
  },
  {
    name: "Not found",
    note: "On a 404 the last crumb becomes “Not found”, leaving a path back.",
    page: macrostratPage("/maps/99999", { is404: true }),
    header: { variant: "compact" },
  },
  {
    name: "Header actions from config",
    note: "A page or subtree’s `headerActions` config leads the action slot.",
    page: macrostratPage("/columns/432", {
      config: { headerActions: ColumnActions },
    }),
  },
  {
    name: "Title adornment",
    note: "`titleAdornment` qualifies the title without joining the actions.",
    page: macrostratPage("/about/people"),
    header: {
      titleAdornment: h(Tag, { intent: "primary", minimal: true }, "Beta"),
    },
  },
  {
    name: "Rockd",
    note: "Another site: only `SiteNavigationProvider` and the routes’ `pageInfo` differ.",
    page: { url: "/orgs/wgnhs", routes: rockdRoutes },
    site: rockd,
  },
  {
    name: "Rockd, compact",
    note: "`shortTitle` stands in on a single row.",
    page: { url: "/orgs/wgnhs", routes: rockdRoutes },
    site: rockd,
    header: { variant: "compact" },
    width: 420,
  },
  {
    name: "PageBreadcrumbs in a navbar",
    note: "The trail on its own, ending with the title, inside other chrome.",
    page: macrostratPage("/lex/strat-names/1205"),
    breadcrumbs: {},
    container: "navbar",
  },
  {
    name: "PageBreadcrumbs, small, in a panel",
    note: "`size: small` for a map’s context panel; `showLogo: false` drops the mark.",
    page: macrostratPage("/maps/5012"),
    breadcrumbs: { size: "small", showLogo: false },
    container: "panel",
    width: 320,
  },
];

const meta: Meta<typeof SitePageHeader> = {
  title: "Navigation components/Site page header",
  component: SitePageHeader,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "`PageHeader` filled from a Vike route. `getBreadcrumbs` matches " +
          "a page at each ancestor URL on the server; each page's " +
          "`pageInfo` config names its crumb; `SiteNavigationProvider` sets " +
          "the site's logo and root. These stories mock the page context.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/** Every scenario at once, for review. */
export const ContactSheet: Story = {
  render: () =>
    h(
      "div.contact-sheet",
      scenarios.map((s) => h(ScenarioFrame, { key: s.name, scenario: s })),
    ),
};

export const Variants: Story = {
  render: () =>
    h(
      "div.contact-sheet",
      (["expanded", "compact", "hybrid"] as const).map((variant) =>
        h(ScenarioFrame, {
          key: variant,
          scenario: {
            name: variant,
            note: "",
            page: macrostratPage("/lex/strat-names/1205"),
            header: { variant },
          },
        }),
      ),
    ),
};

/** A hybrid header over a scrolling page: the title tucks into the trail. */
export const ScrollingPage: Story = {
  render: () =>
    h(
      MockSite,
      {
        page: macrostratPage("/columns/432", {
          config: { headerActions: ColumnActions },
        }),
      },
      h("div.demo-page", [
        h(SitePageHeader, { variant: "hybrid", width: "constrained" }),
        h("main.demo-content", [
          h("p", [
            "Links mark the current page: ",
            h(Link, { href: "/columns/432" }, "this column"),
            " and ",
            h(Link, { href: "/columns" }, "all columns"),
            ".",
          ]),
          ...Array.from({ length: 40 }, (_, i) =>
            h("p", { key: i }, "Scroll to tuck the title into the trail."),
          ),
        ]),
      ]),
    ),
};

function storyFor(s: Scenario): Story {
  return { name: s.name, render: () => h(ScenarioFrame, { scenario: s }) };
}

export const SectionPage = storyFor(scenarios[0]);
export const RecordWithIdentifier = storyFor(scenarios[1]);
export const LongTitleCompact = storyFor(scenarios[2]);
export const DeepTrailNarrow = storyFor(scenarios[4]);
export const LabelsFromSlugs = storyFor(scenarios[6]);
export const NoServerTrail = storyFor(scenarios[7]);
export const NotFound = storyFor(scenarios[8]);
export const HeaderActionsFromConfig = storyFor(scenarios[9]);
export const Rockd = storyFor(scenarios[11]);
export const BreadcrumbsInNavbar = storyFor(scenarios[13]);
export const BreadcrumbsInPanel = storyFor(scenarios[14]);

function ScenarioFrame({ scenario }: { scenario: Scenario }) {
  const { name, note, page, site, width = 720 } = scenario;
  return h("figure.scenario", [
    h("figcaption", [h("strong", name), " ", h("span.url", page.url)]),
    h(
      "div.frame",
      { style: { width } },
      h(MockSite, { page, site }, h(ScenarioBody, { scenario })),
    ),
    h.if(note != "")("p.note", withCode(note)),
  ]);
}

function ScenarioBody({ scenario }: { scenario: Scenario }) {
  const { header = {}, breadcrumbs, container = "page" } = scenario;
  if (breadcrumbs == null) {
    return h("div.page-sample", [
      h(SitePageHeader, header),
      h("div.page-body", "Page content"),
    ]);
  }
  const trail = h(PageBreadcrumbs, breadcrumbs);
  if (container == "navbar") {
    return h(Navbar, { className: "navbar-sample" }, [
      h(Navbar.Group, { align: "left", className: "navbar-trail" }, trail),
      h(Navbar.Group, { align: "right" }, h(NavbarActions)),
    ]);
  }
  return h("div.panel-sample", [trail, h("div.page-body", "Panel content")]);
}

/** Backticked spans of a note, as code. */
function withCode(text: string) {
  return text.split("`").map((part, i) => {
    if (i % 2 == 1) return h("code", { key: i }, part);
    return part;
  });
}

function NavbarActions(): ReactNode {
  return h(PageHeaderButton, { icon: "user", variant: "minimal" });
}

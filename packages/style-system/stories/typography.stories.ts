import { Meta } from "@storybook/react-vite";
import h from "./typography.module.sass";

// Two paths for applying type/spacing tokens into designs:
//   1. `.bn-prose` — opt-in global overlay for free-flowing content (bare tags).
//   2. mixins (`@include bn.heading` etc.) — component-scoped application.
// Both resolve to --bn-* tokens, so dark mode + retheming work for free.

function ProseOverlay() {
  return h("div.frame", [
    h("p.label", ".bn-prose overlay (bare HTML, paragraph skips + rhythm)"),
    h("div.bn-prose", [
      h("h2", "Stratigraphic context"),
      h("p", [
        "Macrostrat organizes geologic units across time and space. Prose like ",
        "this uses the serif prose font, with semantic ",
        h("code", "--bn-paragraph-spacing"),
        " between blocks.",
      ]),
      h("h3", "Column data"),
      h("p", "A second paragraph demonstrates the heading rhythm and skip above."),
      h("ul", [
        h("li", "Consistent list-item spacing"),
        h("li", "Links inherit the semantic link color"),
      ]),
    ]),
  ]);
}

function Mixins() {
  return h("div.frame", [
    h("p.label", "text-style mixins (component-scoped @include)"),
    h("h3.mixin-heading", "heading mixin"),
    h("p.mixin-body", "body mixin — sans-serif UI/body copy at the base size."),
    h("p.mixin-ui", "ui mixin — smaller, tighter line-height for dense controls."),
  ]);
}

export default {
  title: "Style system/Typography",
  component: ProseOverlay,
} as Meta<typeof ProseOverlay>;

export const ProseOverlayStory = { name: "Prose overlay", args: {} };
export const MixinsStory = { name: "Mixins", render: () => h(Mixins) };

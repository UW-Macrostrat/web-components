import { Meta } from "@storybook/react-vite";
import h from "./tokens.module.sass";

// Proving ground for the Bornite design-token system. Renders live swatches and
// samples straight from the `--bn-*` CSS variables, so token edits in
// src/bornite/* show up here immediately (Storybook resolves style-system from
// source). Toggle Storybook's dark mode to exercise the .bp6-dark overrides.

const semanticColors = [
  "--bn-text-color",
  "--bn-text-subtle-color",
  "--bn-text-emphasized-color",
  "--bn-background-color",
  "--bn-panel-background-color",
  "--bn-panel-secondary-background-color",
  "--bn-panel-rule-color",
  "--bn-accent-color",
  "--bn-accent-text-color",
  "--bn-accent-secondary-color",
  "--bn-accent-tertiary-color",
  "--bn-secondary-color",
  "--bn-error-color",
];

const neutralRamp = [
  "--bn-white",
  "--bn-neutral-50",
  "--bn-neutral-100",
  "--bn-neutral-200",
  "--bn-neutral-300",
  "--bn-neutral-400",
  "--bn-neutral-500",
  "--bn-neutral-600",
  "--bn-neutral-700",
  "--bn-neutral-800",
  "--bn-neutral-900",
  "--bn-black",
];

const intents = [
  "--bn-intent-primary",
  "--bn-intent-success",
  "--bn-intent-warning",
  "--bn-intent-danger",
];

const brandPalette = [
  "--bn-purple-700",
  "--bn-purple-500",
  "--bn-purple-200",
  "--bn-pink-500",
  "--bn-pink-200",
  "--bn-mint-500",
  "--bn-mint-300",
  "--bn-sky-500",
  "--bn-sky-200",
];

const typeSizes = [
  "--bn-font-size-xs",
  "--bn-font-size-sm",
  "--bn-font-size-md",
  "--bn-font-size-lg",
  "--bn-font-size-xl",
  "--bn-font-size-2xl",
];

const fontFamilies = [
  "--bn-font-sans",
  "--bn-font-serif",
  "--bn-font-header",
  "--bn-font-mono",
];

const spaceSteps = [
  "--bn-space-1",
  "--bn-space-2",
  "--bn-space-3",
  "--bn-space-4",
  "--bn-space-5",
  "--bn-space-6",
  "--bn-space-7",
  "--bn-space-8",
];

function Swatch({ token }) {
  return h("div.swatch", [
    h("div.chip", { style: { backgroundColor: `var(${token})` } }),
    h("span.label", token),
  ]);
}

function ColorSection({ title, tokens }) {
  return h("section.section", [
    h("h2.section-title", title),
    h(
      "div.row",
      tokens.map((token) => h(Swatch, { key: token, token }))
    ),
  ]);
}

function TypeScaleSection() {
  const samples = typeSizes.map((token) =>
    h(
      "p.type-sample",
      { key: token, style: { fontSize: `var(${token})` } },
      `${token} — Macrostrat`
    )
  );
  return h("section.section", [h("h2.section-title", "Type scale"), ...samples]);
}

function FontFamilySection() {
  const samples = fontFamilies.map((token) =>
    h(
      "p.type-sample",
      { key: token, style: { fontFamily: `var(${token})`, fontSize: "var(--bn-font-size-lg)" } },
      `${token} — The quick brown fox`
    )
  );
  return h("section.section", [
    h("h2.section-title", "Font families"),
    ...samples,
  ]);
}

function SpacingSection() {
  const bars = spaceSteps.map((token) =>
    h("div.swatch", { key: token }, [
      h("div.space-bar", { style: { width: `var(${token})` } }),
      h("span.label", token),
    ])
  );
  return h("section.section", [
    h("h2.section-title", "Spacing scale"),
    h("div.row", bars),
  ]);
}

function TokenGallery() {
  return h("div.gallery", [
    h(ColorSection, { title: "Semantic colors", tokens: semanticColors }),
    h(ColorSection, { title: "Intents (⌁ Blueprint)", tokens: intents }),
    h(ColorSection, { title: "Neutral ramp (primitive)", tokens: neutralRamp }),
    h(ColorSection, { title: "Brand palette (primitive)", tokens: brandPalette }),
    h(FontFamilySection),
    h(TypeScaleSection),
    h(SpacingSection),
  ]);
}

export default {
  title: "Style system/Bornite tokens",
  component: TokenGallery,
} as Meta<typeof TokenGallery>;

export const Tokens = { args: {} };

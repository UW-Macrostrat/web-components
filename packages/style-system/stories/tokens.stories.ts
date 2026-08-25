import { Meta } from "@storybook/react-vite";
import h from "./tokens.module.sass";

// Proving ground for the Paleozoic design-token system. Renders live swatches and
// samples straight from the `--pz-*` CSS variables, so token edits in
// src/paleozoic/* show up here immediately (Storybook resolves style-system from
// source). Toggle Storybook's dark mode to exercise the .bp6-dark overrides.

const semanticColors = [
  "--pz-text-color",
  "--pz-text-subtle-color",
  "--pz-text-emphasized-color",
  "--pz-background-color",
  "--pz-panel-background-color",
  "--pz-panel-secondary-background-color",
  "--pz-panel-rule-color",
  "--pz-accent-color",
  "--pz-accent-text-color",
  "--pz-accent-secondary-color",
  "--pz-accent-tertiary-color",
  "--pz-secondary-color",
  "--pz-error-color",
];

const neutralRamp = [
  "--pz-white",
  "--pz-neutral-50",
  "--pz-neutral-100",
  "--pz-neutral-200",
  "--pz-neutral-300",
  "--pz-neutral-400",
  "--pz-neutral-500",
  "--pz-neutral-600",
  "--pz-neutral-700",
  "--pz-neutral-800",
  "--pz-neutral-900",
  "--pz-black",
];

const intents = [
  "--pz-intent-primary",
  "--pz-intent-success",
  "--pz-intent-warning",
  "--pz-intent-danger",
];

const brandPalette = [
  "--pz-purple-700",
  "--pz-purple-500",
  "--pz-purple-200",
  "--pz-pink-500",
  "--pz-pink-200",
  "--pz-mint-500",
  "--pz-mint-300",
  "--pz-sky-500",
  "--pz-sky-200",
];

const typeSizes = [
  "--pz-font-size-xs",
  "--pz-font-size-sm",
  "--pz-font-size-md",
  "--pz-font-size-lg",
  "--pz-font-size-xl",
  "--pz-font-size-2xl",
];

const fontFamilies = [
  "--pz-font-sans",
  "--pz-font-serif",
  "--pz-font-header",
  "--pz-font-mono",
];

const spaceSteps = [
  "--pz-space-1",
  "--pz-space-2",
  "--pz-space-3",
  "--pz-space-4",
  "--pz-space-5",
  "--pz-space-6",
  "--pz-space-7",
  "--pz-space-8",
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
      { key: token, style: { fontFamily: `var(${token})`, fontSize: "var(--pz-font-size-lg)" } },
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
  title: "Style system/Paleozoic tokens",
  component: TokenGallery,
} as Meta<typeof TokenGallery>;

export const Tokens = { args: {} };

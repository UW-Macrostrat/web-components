import h from "@macrostrat/hyper";

import { PublicationFinder, PubFinderI, Pub } from "../src";
import "./global.scss";
import { Meta, StoryFn } from "@storybook/react";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Form components/Publication finder",
  component: PublicationFinder,
} as Meta<typeof PublicationFinder>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof PublicationFinder> = (args) =>
  h(PublicationFinder, { ...args });

export function PubFinderStory(props: PubFinderI) {
  return h("div", [
    h("h2", ["Search for a Publication"]),
    h("h4", [
      "Powered by ",
      h("a", { href: "https://xdd.wisc.edu/", target: "_blank" }, ["xDD"]),
    ]),
    h(PublicationFinder, { onClick: (e) => console.log(e) }),
  ]);
}

import h from "@macrostrat/hyper";

import { PublicationFinder } from "..";
import "../global.scss";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { PubFinderI, Pub } from "../components";

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Publications/Publication-Finder",
  component: PublicationFinder,
} as ComponentMeta<typeof PublicationFinder>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: ComponentStory<typeof PublicationFinder> = (args) =>
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

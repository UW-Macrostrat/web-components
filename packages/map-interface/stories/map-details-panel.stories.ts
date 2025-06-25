import type { Meta } from "@storybook/react-vite";
import type { StoryObj } from "@storybook/react-vite";
import { ExpansionPanel, LocationPanel } from "../src";
import h from "@macrostrat/hyper";
import { useMapRef, useMapStatus } from "@macrostrat/mapbox-react";
import { useEffect } from "react";
import { InfoDrawerHeader } from "../src/location-panel/header";
import Box from "ui-box";
import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});

const position = {
  lat: 40.7128,
  lng: -74.006,
};

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: "Map interface/Details panel",
  component: LocationPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      story: {
        inline: false,
        iframeHeight: 550,
      },
    },
  },
  decorators: [
    (Story) => {
      return h(
        Box,
        {
          width: 440,
          margin: 10,
          maxHeight: 450,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        },
        h(Story)
      );
    },
  ],
  args: {
    position,
    onClose() {
      console.log("Close");
    },
  },
} as Meta<typeof LocationPanel>;

type Story = StoryObj<typeof LocationPanel>;

export const WithoutPosition = {
  args: {
    position: null,
    title: "New York City",
    onClose() {
      console.log("Close");
    },
    children: [
      h("h1", "New York City"),
      h("p", "New York is a pretty cool place"),
    ],
  },
};

export const NotCloseable = {
  args: {
    title: "New York City",
    position: null,
    onClose: null,
    children: [
      h("h1", "New York City"),
      h("p", "New York is a pretty cool place"),
    ],
  },
};

const loremContent = lorem.generateParagraphs(5).split("\n");

export const FilledPanel: Story = {
  args: {
    bounds: null,
    position: null,
    title: "Where it all happens",
    style: { flexShrink: 1 },
    onClose() {
      console.log("Close");
    },
    children: loremContent.map((t) => h("p", t)),
  },
};

const ExpansionPanelContainer = (props) => {
  const { children } = props;
  return h(Box, children);
};

export const AccordionFilledPanel: Story = {
  args: {
    style: { flexShrink: 1 },
    headerElement: h(
      InfoDrawerHeader,
      {
        bounds: null,
        position: null,
        fixedHeight: true,
        onClose() {
          console.log("Close");
        },
      },
      h("h1", "Where it all happens")
    ),
    contentContainer: ExpansionPanelContainer,
    children: [
      loremContent.map((t, i) => {
        return h(
          ExpansionPanel,
          { title: `Section ${i + 1}`, expanded: i == 2 },
          [h("p", t)]
        );
      }),
    ],
  },
};

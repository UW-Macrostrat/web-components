import type { Meta, StoryObj } from "@storybook/react-vite";
import { ModelInfo } from "../src";

export default {
  title: "Text extractions/Model info",
  component: ModelInfo,
  args: { modelDetailsEndpoint: null },
} satisfies Meta<typeof ModelInfo>;

type Story = StoryObj<typeof ModelInfo>;

export const LinkedModel: Story = {
  args: {
    data: {
      model_name: "Qwen/Qwen3-32B-AWQ",
      modelurl: "https://huggingface.co/Qwen/Qwen3-32B-AWQ",
      model_description: "Hosted extraction model",
      version_name: "1.0.0",
      version_description: "First version",
    },
  },
};

export const DescriptionOnly: Story = {
  args: {
    data: {
      model_name: "Geology extractor",
      model_description:
        "An extraction model trained on geological literature.",
      modelurl: null,
      version_name: "1.0.0",
      version_description: "Adds lithology attributes.",
    },
  },
};

export const PlainName: Story = {
  args: { data: { model_name: "Geology extractor", version_name: "0" } },
};

export const LegacyModel: Story = {
  args: { data: { name: "tree_based_span_bert", description: "Legacy model" } },
};

export const LiveVersionLookup: Story = {
  args: {
    modelDetailsEndpoint: undefined,
    data: { model_id: 7, version_id: 229, name: "qwen3" },
  },
};

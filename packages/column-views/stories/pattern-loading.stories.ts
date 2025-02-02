import h from "@macrostrat/hyper";
import { Meta } from "@storybook/react";

import {
  PatternProvider,
  resolvePattern,
} from "@macrostrat/column-components/stories/base-section";

const meta: Meta<any> = {
  title: "Column views/Patterns",
  // decorators: [
  //   (Story) => {
  //     return h(PatternProvider, h(Story));
  //   },
  // ],
};

export default meta;

function GeologyPattern({ pattern_id }) {
  const url = resolvePattern(pattern_id);
  console.log(pattern_id, url);

  return h("div", [h("img", { src: url })]);
}

GeologyPattern.args = {
  pattern_id: "601",
};

export { GeologyPattern };

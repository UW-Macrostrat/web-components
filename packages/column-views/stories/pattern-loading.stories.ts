import hyper from "@macrostrat/hyper";
import styles from "./pattern-loading.stories.module.sass";
import { Meta } from "@storybook/react";

const h = hyper.styled(styles);

import { resolvePattern } from "../../column-components/stories/base-section";
import { useEffect, useRef, useState } from "react";

const meta: Meta<any> = {
  title: "Column views/Patterns",
};

export default meta;

function GeologyPattern({ pattern_id }) {
  const url = resolvePattern(pattern_id);

  return h("img.pattern-container.basic-pattern-image", { src: url });
}

GeologyPattern.args = {
  pattern_id: "601",
};

export { GeologyPattern };

export function SVGDirectLoadPattern({ pattern_id }) {
  const url = resolvePattern(pattern_id);

  // Fetch the SVG directly
  const ref = useRef();
  const [svgContent, setSVGContent] = useState(null);

  useEffect(() => {
    fetch(url)
      .then((response) => response.text())
      .then((text) => {
        setSVGContent(text);
      });
  }, [url]);

  return h("div.pattern-container.svg-pattern", {
    args: {
      pattern_id: "659",
    },

    ref,

    dangerouslySetInnerHTML: {
      __html: svgContent,
    },
  });
}

SVGDirectLoadPattern.args = {
  pattern_id: "601",
};

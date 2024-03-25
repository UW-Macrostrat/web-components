import h from "@macrostrat/hyper";
import { Annotator } from "poplar-annotation";
import { useRef, useEffect } from "react";

export interface FeedbackComponentProps {
  // Add props here
}

export function FeedbackComponent() {
  const annotator = useRef<Annotator | null>(null);
  const container = useRef<HTMLDivElement | null>();

  useEffect(() => {
    if (container.current == null) return;
    annotator.current = new Annotator(
      "Hello world fffffffff",
      container.current,
      {}
    );
  }, [container.current]);

  return h("div", { className: "feedback-component", ref: container });
}

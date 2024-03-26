import hyper from "@macrostrat/hyper";
import { Annotator } from "poplar-annotation";
import { useRef, useEffect } from "react";
import styles from "./feedback.module.sass";
const h = hyper.styled(styles);

export interface FeedbackComponentProps {
  // Add props here
}

export function FeedbackComponent({ data }) {
  const annotator = useRef<Annotator | null>(null);
  const ref = useRef<HTMLDivElement | null>();

  useEffect(() => {
    if (ref.current == null) return;
    annotator.current = new Annotator(data, ref.current, {});
  }, [ref.current, data]);

  return h("div.feedback-component", { ref });
}

import hyper from "@macrostrat/hyper";
import { Annotator } from "poplar-annotation";
import { useRef, useEffect } from "react";
import FeedbackWrap from "./FeedbackWrap";
import styles from "./feedback.module.sass";
const h = hyper.styled(styles);

export interface FeedbackComponentProps {
  // Add props here
}

export function FeedbackComponent({ data }) {
  const annotator = useRef<FeedbackWrap | null>(null);
  const ref = useRef<HTMLDivElement | null>();

  useEffect(() => {
    if (ref.current == null) return;
    annotator.current = new FeedbackWrap();
  }, [ref.current, data]);

  return h("div.feedback-component", { ref });
}

export { FeedbackWrap };

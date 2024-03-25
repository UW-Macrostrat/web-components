import h from "@macrostrat/hyper";

export interface FeedbackComponentProps {
  // Add props here
}

export function FeedbackComponent(props: FeedbackComponentProps) {
  return h("div", { className: "feedback-component" }, "FeedbackComponent");
}

// @ts-nocheck
import { Component, ReactNode } from "react";
import { Callout } from "@blueprintjs/core";
import h from "@macrostrat/hyper";

function ErrorCallout(props) {
  const { error, title = "Unknown error" } = props;

  return h(
    Callout,
    {
      title,
      icon: "error",
      intent: "danger",
    },
    h(
      "p",
      null,
      props.description ?? error?.toString() ?? "No description available",
    ),
  );
}

type ErrorBoundaryProps = {
  description?: string;
  title?: string;
  fallback?: ReactNode;
  override?: boolean;
  onCatch?(error: Error, info: any): void;
};
type ErrorBoundaryState = {
  error: Error | null;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.log(error);
    this.props.onCatch?.(error, info);
  }

  render() {
    const { error } = this.state;
    const { override = false } = this.props;
    if (error != null || override) {
      if (this.props.fallback != null) return this.props.fallback;

      // You can render any custom fallback UI
      return h(ErrorCallout, {
        error,
        description:
          this.props.description ??
          error?.toString() ??
          "No description available",
        title: this.props.title ?? "A rendering error has occured",
      });
    }

    return this.props.children;
  }
}

export { ErrorBoundary, ErrorCallout };

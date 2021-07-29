import { Component } from "react";
import { Callout } from "@blueprintjs/core";
import h from "@macrostrat/hyper";

function ErrorCallout(props) {
  const { error, description, title } = props;

  const des = description ? description : error.toString();

  return h(
    Callout,
    {
      title,
      icon: "error",
      intent: "danger"
    },
    h("p", null, des)
  );
}

type ErrorBoundaryProps = {
  description?: string;
  title?: string;
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
  }

  render() {
    const { error } = this.state;
    if (error != null) {
      const {
        description = error.toString(),
        title = "A rendering error has occured"
      } = this.props;

      // You can render any custom fallback UI
      return h(ErrorCallout, {
        error,
        description,
        title
      });
    }

    return this.props.children;
  }
}

export { ErrorBoundary, ErrorCallout };

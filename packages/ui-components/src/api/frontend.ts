// @ts-nocheck
import { Component, cloneElement, isValidElement } from "react";
import h from "@macrostrat/hyper";
import { Spinner } from "@blueprintjs/core";
import { APIContext, APIActions, APIHelpers } from "./provider";
import { debounce } from "underscore";
import { APIConfig } from "./types";
import { QueryParams } from "../util/query-string";
import { JSONView } from "../util/json-view";
import { IndexingProvider } from "./indexing";
import { number } from "fp-ts";

interface APIPlaceholderProps {
  isLoading: boolean;
}

const APIResultPlaceholder = (props: APIPlaceholderProps) => {
  return h("div.api-result-placeholder", [h(Spinner)]);
};

type ChildFunction<T> = (d: T) => React.ReactNode;

type APIChild<T> =
  | React.ReactElement<{ data: T; isLoading: boolean }>
  | ChildFunction<T>;

type APIViewProps<T> = {
  children?: APIChild<T>;
  placeholder: React.ComponentType<APIPlaceholderProps>;
  params: QueryParams;
  route: string | null;
  isLoading: boolean;
  data: T;
  totalCount?: number;
  pageCount?: number;
};

interface APIResultProps<T> extends APIViewProps<T> {
  onSuccess: (d: T) => void;
  debounce: number;
  opts?: Partial<APIConfig>;
}

type APIResultState<T> = { data: T; isLoading: boolean };

class APIResultView<T> extends Component<APIResultProps<T>, APIResultState<T>> {
  static contextType = APIContext;
  static defaultProps = {
    route: null,
    params: {},
    opts: {}, // Options passed to `get`
    debug: false,
    onSuccess: () => {},
    primaryKey: "id",
    // If placeholder is not defined, the render
    // method will be called with null data
    placeholder: APIResultPlaceholder,
    debounce: 300,
    children: (data) => {
      return h(JSONView, { data });
    },
  };
  _didFetch: boolean;
  _lazyGetData: () => Promise<void>;

  constructor(props, context) {
    super(props, context);

    this._didFetch = false;

    this.getData = this.getData.bind(this);
    this._lazyGetData = debounce(this.getData, this.props.debounce);

    this.state = { data: null, isLoading: false };
    this.getData();
  }

  buildURL(props = null) {
    const { route, params } = props ?? this.props;
    const { buildURL } = APIHelpers(this.context);
    return buildURL(route, params);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.debounce !== this.props.debounce) {
      this._lazyGetData = debounce(this.getData, this.props.debounce);
    }
    if (this.buildURL() === this.buildURL(prevProps)) return;

    return this._lazyGetData();
  }

  async getData() {
    this._didFetch = false;
    // if (this.context?.get == null) {
    //   return
    // }
    const { route, params, opts } = this.props;
    if (route == null) {
      return;
    }
    const { get } = APIActions(this.context);
    this.setState({ isLoading: true });
    const data = await get(route, params, opts);
    this._didFetch = true;
    // Run side effects...
    this.props.onSuccess(data);
    this.setState({ data, isLoading: false });
  }

  renderInner() {
    const { data, isLoading } = this.state;
    const { children } = this.props;

    if (typeof children == "function") {
      return children(data) as React.ReactElement;
    } else if (isValidElement(children)) {
      return cloneElement(children, {
        data,
        isLoading,
      });
    } else {
      throw new Error(
        "The APIResultView component must have a single child element or a function"
      );
    }
  }

  render() {
    const { data, isLoading } = this.state;
    const { placeholder } = this.props;
    if (data == null && placeholder != null) {
      return h(placeholder, { isLoading });
    }

    if (Array.isArray(data)) {
      return h(
        IndexingProvider,
        {
          totalCount: data.length,
          indexOffset: 0,
        },
        this.renderInner()
      );
    }
    return this.renderInner();
  }
}

export { APIResultView, APIResultProps, APIPlaceholderProps };

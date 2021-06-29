import {
  Component,
  createContext,
  useContext,
  cloneElement,
  isValidElement,
} from "react";
import h from "@macrostrat/hyper";
import { Spinner } from "@blueprintjs/core";
import { APIContext, APIActions, APIHelpers } from "./provider";
import { debounce } from "underscore";
import { APIConfig } from "./types";
import { QueryParams } from "../util/query-string";
import { JSONView } from "../util/json-view";

const APIViewContext = createContext<APIViewCTX<any> | null>(null);
const APIViewConsumer = APIViewContext.Consumer;

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

type APIViewCTX<T> = {
  placeholder: React.ComponentType<APIPlaceholderProps>;
  params: QueryParams;
  route: string | null;
  isLoading: boolean;
  data: T;
  totalCount?: number;
  pageCount?: number;
};

type APIViewProps<T> = {
  children?: APIChild<T>;
} & APIViewCTX<T> &
  APIPlaceholderProps;

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

  render() {
    const { data, isLoading } = this.state;
    let { children, placeholder, params, route } = this.props;
    return h(
      APIView,
      { data, placeholder, params, route, isLoading },
      children
    );
  }
}

const APIView = <T>(props: APIViewProps<T>): React.ReactElement => {
  const { data, children, placeholder, params, route, isLoading, ...rest } =
    props;
  const value = { data, params, placeholder, route, isLoading, ...rest };

  console.warn(
    `The APIView component is deprecated in @macrostrat/ui-components "
     v0.4.x and will be removed in the 0.5 series. Please migrate to react hooks.`
  );

  if (data == null && placeholder != null) {
    return h(placeholder, { isLoading });
  }
  if (typeof children == "function") {
    return h(APIViewContext.Provider, { value }, children(data));
  } else if (isValidElement(children)) {
    return h(
      APIViewContext.Provider,
      { value },
      cloneElement(children, {
        data,
        isLoading,
      })
    );
  }
  return null;
};

APIView.defaultProps = {
  isLoading: false,
};

const useAPIView = () => useContext(APIViewContext);

export {
  APIViewContext,
  APIViewConsumer,
  APIResultView,
  APIResultProps,
  APIPlaceholderProps,
  APIView,
  useAPIView,
};

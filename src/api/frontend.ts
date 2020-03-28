/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createContext, useContext} from 'react';
import h from 'react-hyperscript';
import axios from 'axios';
import {Spinner, Button, ButtonGroup,
        Intent, NonIdealState} from '@blueprintjs/core';
import {AppToaster} from '../notify';
import ReactJson from 'react-json-view';
import {APIContext, APIProvider} from './provider';
import {debounce} from 'underscore';

const APIViewContext = createContext({});
const APIViewConsumer = APIViewContext.Consumer;

class Pagination extends Component {
  render() {
    const {currentPage, nextDisabled, setPage} = this.props;
    return h(ButtonGroup, [
      h(Button, {
        onClick: setPage(currentPage-1),
        icon: 'arrow-left',
        disabled: currentPage <= 0
      }, "Previous"),
      h(Button, {
        onClick: setPage(currentPage+1),
        rightIcon: 'arrow-right',
        disabled: nextDisabled
      }, "Next")
    ]);
  }
}

const APIResultPlaceholder = props=> {
  return h('div.api-result-placeholder', [
    h(Spinner)
  ]);
};

class __APIResultView extends Component {
  static contextType = APIContext;
  static defaultProps = {
    route: null,
    params: {},
    opts: {}, // Options passed to `get`
    debug: false,
    onSuccess: console.log,
    primaryKey: 'id',
    // If placeholder is not defined, the render
    // method will be called with null data
    placeholder: APIResultPlaceholder,
    debounce: 300
  }
  constructor(props) {
    super(props);

    this._didFetch = false

    this.buildURL = this.buildURL.bind(this);
    this.createDebouncedFunction = this.createDebouncedFunction.bind(this);
    this.getData = this.getData.bind(this)

    this.state = {data: null};
    this.createDebouncedFunction();
    this.getData();
  }

  buildURL(props){
    if (props == null) { ({
      props
    } = this); }
    const {helpers: {buildURL}} = this.context;
    const {route, params} = props;
    return buildURL(route, params);
  }

  createDebouncedFunction() {
    return this.lazyGetData = debounce(this.getData, this.props.debounce);
  }

  componentDidUpdate(prevProps){
    if (prevProps.debounce !== this.props.debounce) {
      this.createDebouncedFunction();
    }
    if (this.buildURL() === this.buildURL(prevProps) && this._didFetch) return

    return this.lazyGetData();
  }

  async getData() {
    this._didFetch = false
    if (this.context?.get == null) {
      return
    }
    const {route, params, opts, onError: _onError} = this.props;
    if (route == null) { return; }
    const data = await this.context.get(route, params, opts);
    this._didFetch = true
    // Run side effects...
    this.props.onSuccess(data);
    this.setState({data});
  };

  render() {
    const {data} = this.state;
    let {children, placeholder} = this.props;
    if ((children == null)) {
      children = data=> {
        return h(ReactJson, {src: data});
      };
    }

    if (data == null && placeholder != null) {
      return h(placeholder);
    }
    const value = {deleteItem: this.deleteItem};
    return h(APIViewContext.Provider, {value}, (
        children(data)
    ));
  }

  deleteItem = async data=> {
    console.warn("deleteItem is deprecated")
    const {route, primaryKey} = this.props;
    const id = data[primaryKey];
    const itemRoute = route+`/${id}`;
    try {
      const res = await axios.delete(itemRoute);
      return this.getData();
    } catch (err) {
      let {message} = err;
      if (err.response.status === 403) {
        ({
          message
        } = err.response.data);
      }
      const intent = Intent.DANGER;
      return AppToaster.show({message, intent});
    }
  };
}

const APIResultView = function(props){
  // Enable the use of the APIResultView outside of the APIContext
  // by wrapping it in a placeholder APIContext
  const ctx = useContext(APIContext);
  if (ctx == null) return null
  const component = h(__APIResultView, props);
  if (ctx?.get != null) { return component; }
  console.log("Wrapping in API context")
  return h(APIProvider, {baseURL: ""}, component);
};

class PagedAPIView extends Component {
  static initClass() {
    this.defaultProps = {
      count: null,
      perPage: 20,
      topPagination: false,
      bottomPagination: true,
      extraPagination: null,
      opts: {}, // Options passed to GET
      params: {},
      getTotalCount(response){
        const {headers} = response;
        return parseInt(headers['x-total-count']);
      }
    };
  }
  constructor(props){
    super(props);
    this.setPage = this.setPage.bind(this);
    this.params = this.params.bind(this);
    this.state = {currentPage: 0, count: null};
  }

  setPage(i){ return () => {
    return this.setState({currentPage: i});
  }; }

  renderPagination() {
    const {perPage} = this.props;
    const {count} = this.state;
    let nextDisabled = false;
    let paginationInfo = null;
    let currentPage = this.currentPage();
    const lastPage = this.lastPage();

    if (lastPage != null) {
      if (currentPage >= lastPage) {
        currentPage = lastPage;
        nextDisabled = true;
      }
      paginationInfo = h('div', {disabled: true}, [
        `${currentPage+1} of ${lastPage+1} (${count} records)`
      ]);
    }

    return h('div.pagination-controls', [
      h(Pagination, {currentPage, nextDisabled, setPage: this.setPage}),
      this.props.extraPagination,
      paginationInfo
    ]);
  }

  lastPage() {
    const {count} = this.state;
    const {perPage} = this.props;
    if (count == null) { return null; }
    let pages = Math.floor(count/perPage);
    if ((count%perPage) === 0) {
      pages -= 1;
    }
    return pages;
  }

  currentPage() {
    let {currentPage} = this.state;
    const lastPage = this.lastPage();
    if ((lastPage != null) && (currentPage >= lastPage)) {
      return lastPage;
    }
    if (currentPage < 0) {
      currentPage = 0;
    }
    return currentPage;
  }

  params() {
    const {params, perPage} = this.props;
    let {offset, limit, ...otherParams} = params;
    const currentPage = this.currentPage();
    if (offset == null) { offset = 0; }
    offset += currentPage*perPage;

    // This shouldn't happen but it does
    if (offset < 0) {
      offset = 0;
    }

    if ((limit == null) || (limit > perPage)) {
      limit = perPage;
    }

    return {offset, limit, ...otherParams};
  }

  render() {
    let {
      route,
      perPage,
      children,
      getTotalCount,
      primaryKey,
      count,
      topPagination,
      bottomPagination,
      extraPagination,
      params,
      opts,
      ...rest
    } = this.props;

    params = this.params();

    // Create new onResponse function
    const {onResponse: __onResponse} = opts;
    const onResponse = response=> {
      count = getTotalCount(response);
      this.setState({count});
      // Run inherited onResponse if it exists
      if (__onResponse != null) { return __onResponse(response); }
    };

    // Options for get
    opts = {...opts, onResponse};

    const _children = data=> {
      if (this.state.count === 0) {
        return h(NonIdealState, {icon: 'search', title: "No results"});
      }
      return children(data);
    };

    return h('div.pagination-container', rest, [
      topPagination ? this.renderPagination() : undefined,
      h(APIResultView, {route, params, opts, primaryKey}, _children),
      bottomPagination ? this.renderPagination() : undefined
    ]);
  }
}
PagedAPIView.initClass();

export {
  APIViewContext, APIViewConsumer,
  APIResultView, PagedAPIView
};

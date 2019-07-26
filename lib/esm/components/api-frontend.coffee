import { createContext, Component } from 'react';
import h from 'react-hyperscript';
import { debounce } from 'underscore';
import axios from 'axios';
import { APIContext } from './api.coffee';
import { Spinner, Intent, ButtonGroup, Button, NonIdealState } from '@blueprintjs/core';
import { AppToaster } from './notify.coffee';
import ReactJson from 'react-json-view';

var APIResultPlaceholder, APIResultView, APIViewConsumer, APIViewContext, PagedAPIView, Pagination,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

APIViewContext = createContext({});

APIViewConsumer = APIViewContext.Consumer;

Pagination = class Pagination extends Component {
  render() {
    var currentPage, nextDisabled, setPage;
    ({currentPage, nextDisabled, setPage} = this.props);
    return h(ButtonGroup, [
      h(Button,
      {
        onClick: setPage(currentPage - 1),
        icon: 'arrow-left',
        disabled: currentPage <= 0
      },
      "Previous"),
      h(Button,
      {
        onClick: setPage(currentPage + 1),
        rightIcon: 'arrow-right',
        disabled: nextDisabled
      },
      "Next")
    ]);
  }

};

APIResultPlaceholder = (props) => {
  return h('div.api-result-placeholder', [h(Spinner)]);
};

APIResultView = (function() {
  class APIResultView extends Component {
    constructor() {
      super(...arguments);
      this.buildURL = this.buildURL.bind(this);
      this.getData = this.getData.bind(this);
      this.deleteItem = this.deleteItem.bind(this);
      this.state = {
        data: null
      };
      this.getData();
    }

    buildURL(props) {
      var buildURL, params, route;
      boundMethodCheck(this, APIResultView);
      if (props == null) {
        props = this.props;
      }
      ({
        helpers: {buildURL}
      } = this.context);
      ({route, params} = props);
      return buildURL(route, params);
    }

    componentDidUpdate(prevProps) {
      var lazyGetData;
      if (this.buildURL() === this.buildURL(prevProps)) {
        return;
      }
      lazyGetData = debounce(this.getData, 300);
      return lazyGetData();
    }

    async getData() {
      var _onError, data, get, opts, params, route;
      boundMethodCheck(this, APIResultView);
      ({get} = this.context);
      if (get == null) {
        throw "APIResultView component must inhabit an APIContext";
      }
      ({
        route,
        params,
        opts,
        onError: _onError
      } = this.props);
      if (route == null) {
        return;
      }
      data = (await get(route, params, opts));
      return this.setState({data});
    }

    render() {
      var children, data, placeholder, value;
      ({data} = this.state);
      ({children, placeholder} = this.props);
      if (children == null) {
        children = (data) => {
          return h(ReactJson, {
            src: data
          });
        };
      }
      if ((data == null) && (placeholder != null)) {
        return h(placeholder);
      }
      value = {
        deleteItem: this.deleteItem
      };
      return h(APIViewContext.Provider, {value}, children(data));
    }

    async deleteItem(data) {
      var err, id, intent, itemRoute, message, primaryKey, res, route;
      boundMethodCheck(this, APIResultView);
      ({route, primaryKey} = this.props);
      id = data[primaryKey];
      itemRoute = route + `/${id}`;
      try {
        res = (await axios.delete(itemRoute));
        return this.getData();
      } catch (error) {
        err = error;
        ({message} = err);
        if (err.response.status === 403) {
          message = err.response.data.message;
        }
        intent = Intent.DANGER;
        return AppToaster.show({message, intent});
      }
    }

  }
  APIResultView.contextType = APIContext;

  APIResultView.defaultProps = {
    route: null,
    params: {},
    opts: {},
    debug: false,
    success: console.log,
    primaryKey: 'id',
    // If placeholder is not defined, the render
    // method will be called with null data
    placeholder: APIResultPlaceholder
  };

  return APIResultView;

}).call(undefined);

PagedAPIView = (function() {
  class PagedAPIView extends Component {
    constructor(props) {
      super(props);
      this.setPage = this.setPage.bind(this);
      this.params = this.params.bind(this);
      this.state = {
        currentPage: 0,
        count: null
      };
    }

    setPage(i) {
      boundMethodCheck(this, PagedAPIView);
      return () => {
        return this.setState({
          currentPage: i
        });
      };
    }

    renderPagination() {
      var count, currentPage, lastPage, nextDisabled, paginationInfo, perPage;
      ({perPage} = this.props);
      ({count} = this.state);
      nextDisabled = false;
      paginationInfo = null;
      currentPage = this.currentPage();
      lastPage = this.lastPage();
      if (lastPage != null) {
        if (currentPage >= lastPage) {
          currentPage = lastPage;
          nextDisabled = true;
        }
        paginationInfo = h('div', {
          disabled: true
        }, [`${currentPage + 1} of ${lastPage + 1} (${count} records)`]);
      }
      return h('div.pagination-controls', [
        h(Pagination,
        {
          currentPage,
          nextDisabled,
          setPage: this.setPage
        }),
        this.props.extraPagination,
        paginationInfo
      ]);
    }

    lastPage() {
      var count, pages, perPage;
      ({count} = this.state);
      ({perPage} = this.props);
      if (count == null) {
        return null;
      }
      pages = Math.floor(count / perPage);
      if (count % perPage === 0) {
        pages -= 1;
      }
      return pages;
    }

    currentPage() {
      var currentPage, lastPage;
      ({currentPage} = this.state);
      lastPage = this.lastPage();
      if ((lastPage != null) && currentPage >= lastPage) {
        return lastPage;
      }
      if (currentPage < 0) {
        currentPage = 0;
      }
      return currentPage;
    }

    params() {
      var currentPage, limit, offset, otherParams, params, perPage;
      boundMethodCheck(this, PagedAPIView);
      ({params, perPage} = this.props);
      ({offset, limit, ...otherParams} = params);
      currentPage = this.currentPage();
      if (offset == null) {
        offset = 0;
      }
      offset += currentPage * perPage;
      // This shouldn't happen but it does
      if (offset < 0) {
        offset = 0;
      }
      if ((limit == null) || limit > perPage) {
        limit = perPage;
      }
      return {offset, limit, ...otherParams};
    }

    render() {
      var __onResponse, _children, bottomPagination, children, count, extraPagination, getTotalCount, onResponse, opts, params, perPage, primaryKey, rest, route, topPagination;
      ({route, perPage, children, getTotalCount, primaryKey, count, topPagination, bottomPagination, extraPagination, params, opts, ...rest} = this.props);
      params = this.params();
      ({
        // Create new onResponse function
        onResponse: __onResponse
      } = opts);
      onResponse = (response) => {
        count = getTotalCount(response);
        this.setState({count});
        // Run inherited onResponse if it exists
        if (__onResponse != null) {
          return __onResponse(response);
        }
      };
      // Options for get
      opts = {...opts, onResponse};
      _children = (data) => {
        if (this.state.count === 0) {
          return h(NonIdealState, {
            icon: 'search',
            title: "No results"
          });
        }
        return children(data);
      };
      return h('div.pagination-container', rest, [topPagination ? this.renderPagination() : void 0, h(APIResultView, {route, params, opts, primaryKey}, _children), bottomPagination ? this.renderPagination() : void 0]);
    }

  }
  PagedAPIView.defaultProps = {
    count: null,
    perPage: 20,
    topPagination: false,
    bottomPagination: true,
    extraPagination: null,
    opts: {},
    params: {},
    getTotalCount: function(response) {
      var headers;
      ({headers} = response);
      return parseInt(headers['x-total-count']);
    }
  };

  return PagedAPIView;

}).call(undefined);

export { APIResultView, APIViewConsumer, APIViewContext, PagedAPIView };

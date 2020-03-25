'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var underscore = require('underscore');
var axios = _interopDefault(require('axios'));
var __chunk_2 = require('./api.js');
var core = require('@blueprintjs/core');
var __chunk_3 = require('./notify.js');
var ReactJson = _interopDefault(require('react-json-view'));

var APIResultPlaceholder,
    Pagination,
    __APIResultView,
    boundMethodCheck = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};
exports.APIViewContext = react.createContext({});
exports.APIViewConsumer = exports.APIViewContext.Consumer;

Pagination =
/*#__PURE__*/
function (_Component) {
  __chunk_1.inherits(Pagination, _Component);

  function Pagination() {
    __chunk_1.classCallCheck(this, Pagination);

    return __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(Pagination).apply(this, arguments));
  }

  __chunk_1.createClass(Pagination, [{
    key: "render",
    value: function render() {
      var currentPage, nextDisabled, setPage;
      var _this$props = this.props;
      currentPage = _this$props.currentPage;
      nextDisabled = _this$props.nextDisabled;
      setPage = _this$props.setPage;
      return h(core.ButtonGroup, [h(core.Button, {
        onClick: setPage(currentPage - 1),
        icon: 'arrow-left',
        disabled: currentPage <= 0
      }, "Previous"), h(core.Button, {
        onClick: setPage(currentPage + 1),
        rightIcon: 'arrow-right',
        disabled: nextDisabled
      }, "Next")]);
    }
  }]);

  return Pagination;
}(react.Component);

APIResultPlaceholder = function APIResultPlaceholder(props) {
  return h('div.api-result-placeholder', [h(core.Spinner)]);
};

__APIResultView = function () {
  var __APIResultView =
  /*#__PURE__*/
  function (_Component2) {
    __chunk_1.inherits(__APIResultView, _Component2);

    function __APIResultView() {
      var _this;

      __chunk_1.classCallCheck(this, __APIResultView);

      _this = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(__APIResultView).apply(this, arguments));
      _this.buildURL = _this.buildURL.bind(__chunk_1.assertThisInitialized(_this));
      _this.createDebouncedFunction = _this.createDebouncedFunction.bind(__chunk_1.assertThisInitialized(_this));
      _this.getData = _this.getData.bind(__chunk_1.assertThisInitialized(_this));
      _this.deleteItem = _this.deleteItem.bind(__chunk_1.assertThisInitialized(_this));
      _this.state = {
        data: null
      };

      _this.createDebouncedFunction();

      _this.getData();

      return _this;
    }

    __chunk_1.createClass(__APIResultView, [{
      key: "buildURL",
      value: function buildURL(props) {
        var buildURL, params, route;
        boundMethodCheck(this, __APIResultView);

        if (props == null) {
          props = this.props;
        }

        buildURL = this.context.helpers.buildURL;
        var _props = props;
        route = _props.route;
        params = _props.params;
        return buildURL(route, params);
      }
    }, {
      key: "createDebouncedFunction",
      value: function createDebouncedFunction() {
        boundMethodCheck(this, __APIResultView);
        return this.lazyGetData = underscore.debounce(this.getData, this.props.debounce);
      }
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate(prevProps) {
        if (prevProps.debounce !== this.props.debounce) {
          this.createDebouncedFunction();
        }

        if (this.buildURL() === this.buildURL(prevProps)) {
          return;
        }

        return this.lazyGetData();
      }
    }, {
      key: "getData",
      value: function () {
        var _getData = __chunk_1.asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee() {
          var _onError, data, get, opts, params, route, _this$props2;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  boundMethodCheck(this, __APIResultView);
                  get = this.context.get;

                  if (!(get == null)) {
                    _context.next = 4;
                    break;
                  }

                  throw "APIResultView component must inhabit an APIContext";

                case 4:
                  _this$props2 = this.props;
                  route = _this$props2.route;
                  params = _this$props2.params;
                  opts = _this$props2.opts;
                  _onError = _this$props2.onError;

                  if (!(route == null)) {
                    _context.next = 11;
                    break;
                  }

                  return _context.abrupt("return");

                case 11:
                  _context.next = 13;
                  return get(route, params, opts);

                case 13:
                  data = _context.sent;
                  // Run side effects...
                  this.props.onSuccess(data);
                  return _context.abrupt("return", this.setState({
                    data: data
                  }));

                case 16:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function getData() {
          return _getData.apply(this, arguments);
        }

        return getData;
      }()
    }, {
      key: "render",
      value: function render() {
        var children, data, placeholder, value;
        data = this.state.data;
        var _this$props3 = this.props;
        children = _this$props3.children;
        placeholder = _this$props3.placeholder;

        if (children == null) {
          children = function children(data) {
            return h(ReactJson, {
              src: data
            });
          };
        }

        if (data == null && placeholder != null) {
          return h(placeholder);
        }

        value = {
          deleteItem: this.deleteItem
        };
        return h(exports.APIViewContext.Provider, {
          value: value
        }, children(data));
      }
    }, {
      key: "deleteItem",
      value: function () {
        var _deleteItem = __chunk_1.asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee2(data) {
          var err, id, intent, itemRoute, message, primaryKey, res, route, _this$props4, _err;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  boundMethodCheck(this, __APIResultView);
                  _this$props4 = this.props;
                  route = _this$props4.route;
                  primaryKey = _this$props4.primaryKey;
                  id = data[primaryKey];
                  itemRoute = route + "/".concat(id);
                  _context2.prev = 6;
                  _context2.next = 9;
                  return axios["delete"](itemRoute);

                case 9:
                  res = _context2.sent;
                  return _context2.abrupt("return", this.getData());

                case 13:
                  _context2.prev = 13;
                  _context2.t0 = _context2["catch"](6);
                  err = _context2.t0;
                  _err = err;
                  message = _err.message;

                  if (err.response.status === 403) {
                    message = err.response.data.message;
                  }

                  intent = core.Intent.DANGER;
                  return _context2.abrupt("return", __chunk_3.AppToaster.show({
                    message: message,
                    intent: intent
                  }));

                case 21:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this, [[6, 13]]);
        }));

        function deleteItem(_x) {
          return _deleteItem.apply(this, arguments);
        }

        return deleteItem;
      }()
    }]);

    return __APIResultView;
  }(react.Component);
  __APIResultView.contextType = __chunk_2.APIContext;
  __APIResultView.defaultProps = {
    route: null,
    params: {},
    opts: {},
    debug: false,
    onSuccess: console.log,
    primaryKey: 'id',
    // If placeholder is not defined, the render
    // method will be called with null data
    placeholder: APIResultPlaceholder,
    debounce: 300
  };
  return __APIResultView;
}.call(undefined);

exports.APIResultView = function APIResultView(props) {
  var component, ctx; // Enable the use of the APIResultView outside of the APIContext
  // by wrapping it in a placeholder APIContext

  ctx = react.useContext(__chunk_2.APIContext);
  component = h(__APIResultView, props);

  if (ctx.get != null) {
    return component;
  }

  return h(__chunk_2.APIProvider, {
    baseURL: ""
  }, component);
};

exports.PagedAPIView = function () {
  var PagedAPIView =
  /*#__PURE__*/
  function (_Component3) {
    __chunk_1.inherits(PagedAPIView, _Component3);

    function PagedAPIView(props) {
      var _this2;

      __chunk_1.classCallCheck(this, PagedAPIView);

      _this2 = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(PagedAPIView).call(this, props));
      _this2.setPage = _this2.setPage.bind(__chunk_1.assertThisInitialized(_this2));
      _this2.params = _this2.params.bind(__chunk_1.assertThisInitialized(_this2));
      _this2.state = {
        currentPage: 0,
        count: null
      };
      return _this2;
    }

    __chunk_1.createClass(PagedAPIView, [{
      key: "setPage",
      value: function setPage(i) {
        var _this3 = this;

        boundMethodCheck(this, PagedAPIView);
        return function () {
          return _this3.setState({
            currentPage: i
          });
        };
      }
    }, {
      key: "renderPagination",
      value: function renderPagination() {
        var count, currentPage, lastPage, nextDisabled, paginationInfo, perPage;
        perPage = this.props.perPage;
        count = this.state.count;
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
          }, ["".concat(currentPage + 1, " of ").concat(lastPage + 1, " (").concat(count, " records)")]);
        }

        return h('div.pagination-controls', [h(Pagination, {
          currentPage: currentPage,
          nextDisabled: nextDisabled,
          setPage: this.setPage
        }), this.props.extraPagination, paginationInfo]);
      }
    }, {
      key: "lastPage",
      value: function lastPage() {
        var count, pages, perPage;
        count = this.state.count;
        perPage = this.props.perPage;

        if (count == null) {
          return null;
        }

        pages = Math.floor(count / perPage);

        if (count % perPage === 0) {
          pages -= 1;
        }

        return pages;
      }
    }, {
      key: "currentPage",
      value: function currentPage() {
        var currentPage, lastPage;
        currentPage = this.state.currentPage;
        lastPage = this.lastPage();

        if (lastPage != null && currentPage >= lastPage) {
          return lastPage;
        }

        if (currentPage < 0) {
          currentPage = 0;
        }

        return currentPage;
      }
    }, {
      key: "params",
      value: function params() {
        var currentPage, limit, offset, otherParams, params, perPage;
        boundMethodCheck(this, PagedAPIView);
        var _this$props5 = this.props;
        params = _this$props5.params;
        perPage = _this$props5.perPage;
        var _params = params;
        offset = _params.offset;
        limit = _params.limit;
        otherParams = __chunk_1.objectWithoutProperties(_params, ["offset", "limit"]);
        currentPage = this.currentPage();

        if (offset == null) {
          offset = 0;
        }

        offset += currentPage * perPage; // This shouldn't happen but it does

        if (offset < 0) {
          offset = 0;
        }

        if (limit == null || limit > perPage) {
          limit = perPage;
        }

        return __chunk_1.objectSpread2({
          offset: offset,
          limit: limit
        }, otherParams);
      }
    }, {
      key: "render",
      value: function render() {
        var _this4 = this;

        var __onResponse, _children, bottomPagination, children, count, extraPagination, getTotalCount, onResponse, opts, params, perPage, primaryKey, rest, route, topPagination;

        var _this$props6 = this.props;
        route = _this$props6.route;
        perPage = _this$props6.perPage;
        children = _this$props6.children;
        getTotalCount = _this$props6.getTotalCount;
        primaryKey = _this$props6.primaryKey;
        count = _this$props6.count;
        topPagination = _this$props6.topPagination;
        bottomPagination = _this$props6.bottomPagination;
        extraPagination = _this$props6.extraPagination;
        params = _this$props6.params;
        opts = _this$props6.opts;
        rest = __chunk_1.objectWithoutProperties(_this$props6, ["route", "perPage", "children", "getTotalCount", "primaryKey", "count", "topPagination", "bottomPagination", "extraPagination", "params", "opts"]);
        params = this.params();
        var _opts = opts;
        __onResponse = _opts.onResponse;

        onResponse = function onResponse(response) {
          count = getTotalCount(response);

          _this4.setState({
            count: count
          }); // Run inherited onResponse if it exists


          if (__onResponse != null) {
            return __onResponse(response);
          }
        }; // Options for get


        opts = __chunk_1.objectSpread2({}, opts, {
          onResponse: onResponse
        });

        _children = function _children(data) {
          if (_this4.state.count === 0) {
            return h(core.NonIdealState, {
              icon: 'search',
              title: "No results"
            });
          }

          return children(data);
        };

        return h('div.pagination-container', rest, [topPagination ? this.renderPagination() : void 0, h(exports.APIResultView, {
          route: route,
          params: params,
          opts: opts,
          primaryKey: primaryKey
        }, _children), bottomPagination ? this.renderPagination() : void 0]);
      }
    }]);

    return PagedAPIView;
  }(react.Component);
  PagedAPIView.defaultProps = {
    count: null,
    perPage: 20,
    topPagination: false,
    bottomPagination: true,
    extraPagination: null,
    opts: {},
    params: {},
    getTotalCount: function getTotalCount(response) {
      var headers;
      headers = response.headers;
      return parseInt(headers['x-total-count']);
    }
  };
  return PagedAPIView;
}.call(undefined);
//# sourceMappingURL=api-frontend.js.map

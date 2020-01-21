import { createContext, Component, useContext } from 'react';
import h from 'react-hyperscript';
import { memoize, debounce } from 'underscore';
import axios, { post, get } from 'axios';
import { Toaster, ButtonGroup, Button, Spinner, NonIdealState, Intent, Alert, AnchorButton, Collapse, Card, Tag, EditableText } from '@blueprintjs/core';
import ReactJson from 'react-json-view';
import classNames from 'classnames';
import { withRouter, NavLink, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import Dropzone from 'react-dropzone';
import { findDOMNode } from 'react-dom';
import { DateInput } from '@blueprintjs/datetime';
import update from 'immutability-helper';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};

  var target = _objectWithoutPropertiesLoose(source, excluded);

  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _taggedTemplateLiteral(strings, raw) {
  if (!raw) {
    raw = strings.slice(0);
  }

  return Object.freeze(Object.defineProperties(strings, {
    raw: {
      value: Object.freeze(raw)
    }
  }));
}

var APIConsumer,
    APIContext,
    APIProvider,
    buildQueryString,
    boundMethodCheck = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};
APIContext = createContext({});
APIConsumer = APIContext.Consumer;

buildQueryString = function buildQueryString() {
  var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var p;
  p = new URLSearchParams(params).toString();

  if (p !== "") {
    p = "?" + p;
  }

  return p;
};

APIProvider = function () {
  var APIProvider =
  /*#__PURE__*/
  function (_Component) {
    _inherits(APIProvider, _Component);

    function APIProvider() {
      var _this;

      _classCallCheck(this, APIProvider);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(APIProvider).apply(this, arguments));
      _this.buildURL = _this.buildURL.bind(_assertThisInitialized(_this));
      _this.post = _this.post.bind(_assertThisInitialized(_this));
      _this.get = _this.get.bind(_assertThisInitialized(_this));
      _this.runQuery = _this.runQuery.bind(_assertThisInitialized(_this));
      _this.processOptions = _this.processOptions.bind(_assertThisInitialized(_this));
      return _this;
    }

    _createClass(APIProvider, [{
      key: "render",
      value: function render() {
        var actions, baseURL, helpers, onError, rest, unwrapResponse, value;
        var _this$props = this.props;
        baseURL = _this$props.baseURL;
        unwrapResponse = _this$props.unwrapResponse;
        onError = _this$props.onError;
        rest = _objectWithoutProperties(_this$props, ["baseURL", "unwrapResponse", "onError"]);
        helpers = {
          buildURL: this.buildURL,
          buildQueryString: buildQueryString
        };
        actions = {
          post: this.post,
          get: this.get
        };
        value = _objectSpread2({}, rest, {}, actions, {
          helpers: helpers,
          baseURL: baseURL,
          onError: onError
        });
        return h(APIContext.Provider, {
          value: value
        }, this.props.children);
      }
    }, {
      key: "buildURL",
      value: function buildURL(route) {
        var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var baseURL;
        boundMethodCheck(this, APIProvider);
        baseURL = this.props.baseURL;

        if (route == null) {
          return null;
        }

        console.log(route);

        if (!(route.startsWith(baseURL) || route.startsWith('http'))) {
          route = baseURL + route;
        }

        route += buildQueryString(params);
        return route;
      }
    }, {
      key: "post",
      value: function post$1() {
        var opts, params, payload, route, url;
        boundMethodCheck(this, APIProvider);

        if (arguments.length === 4) {
          var _arguments = Array.prototype.slice.call(arguments);

          route = _arguments[0];
          params = _arguments[1];
          payload = _arguments[2];
          opts = _arguments[3];
        } else if (arguments.length === 3) {
          var _arguments2 = Array.prototype.slice.call(arguments);

          route = _arguments2[0];
          payload = _arguments2[1];
          opts = _arguments2[2];
        } else if (arguments.length === 2) {
          var _arguments3 = Array.prototype.slice.call(arguments);

          route = _arguments3[0];
          payload = _arguments3[1];
        } else {
          throw "No data to post";
        }

        if (opts == null) {
          opts = {};
        }

        if (params == null) {
          params = {};
        }

        url = this.buildURL(route, params);
        opts = this.processOptions(opts);
        return this.runQuery(post(url, payload), route, url, "POST", opts);
      }
    }, {
      key: "get",
      value: function get$1(route, params, opts) {
        var fn, url;
        boundMethodCheck(this, APIProvider);

        if (params == null) {
          params = {};
        }

        if (opts == null) {
          opts = params;
          params = {};
        }

        url = this.buildURL(route, params);
        opts = this.processOptions(opts);
        fn = get;

        if (opts.memoize) {
          fn = memoize(get);
        }

        return this.runQuery(fn(url), route, url, "GET", opts);
      }
    }, {
      key: "runQuery",
      value: function () {
        var _runQuery = _asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee(promise, route, url, method, opts) {
          var data, err, onError, res, _res;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  boundMethodCheck(this, APIProvider);
                  onError = opts.onError;
                  _context.prev = 2;
                  _context.next = 5;
                  return promise;

                case 5:
                  res = _context.sent;
                  opts.onResponse(res);
                  _res = res;
                  data = _res.data;

                  if (!(data == null)) {
                    _context.next = 11;
                    break;
                  }

                  throw res.error || "No data!";

                case 11:
                  return _context.abrupt("return", opts.unwrapResponse(data));

                case 14:
                  _context.prev = 14;
                  _context.t0 = _context["catch"](2);
                  err = _context.t0;

                  if (opts.handleError) {
                    _context.next = 19;
                    break;
                  }

                  throw err;

                case 19:
                  console.error(err);
                  onError(route, {
                    error: err,
                    response: res,
                    endpoint: url,
                    method: method
                  });
                  return _context.abrupt("return", null);

                case 22:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this, [[2, 14]]);
        }));

        function runQuery(_x, _x2, _x3, _x4, _x5) {
          return _runQuery.apply(this, arguments);
        }

        return runQuery;
      }()
    }, {
      key: "processOptions",
      value: function processOptions() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        boundMethodCheck(this, APIProvider); // Standardize option values
        // (some props can be passed as options)

        if (opts.fullResponse == null) {
          opts.fullResponse = false;
        }

        if (opts.handleError == null) {
          opts.handleError = true;
        }

        if (opts.memoize == null) {
          opts.memoize = false;
        }

        if (opts.onError == null) {
          opts.onError = this.props.onError;
        } // Run some side effects with the response (e.g. process headers)


        if (opts.onResponse == null) {
          opts.onResponse = function () {};
        }

        if (opts.unwrapResponse == null) {
          opts.unwrapResponse = this.props.unwrapResponse;
        }

        if (opts.fullResponse) {
          opts.unwrapResponse = function (data) {
            return data;
          };
        }

        return opts;
      }
    }]);

    return APIProvider;
  }(Component);
  APIProvider.defaultProps = {
    baseURL: "/api",
    unwrapResponse: function unwrapResponse(res) {
      return res;
    },
    onError: function onError(route, opts) {
      var error; // This is a non-intuitive signature

      error = opts.error;

      if (error == null) {
        error = opts;
      }

      throw error;
    }
  };
  return APIProvider;
}.call(undefined);

var AppToaster;
//AppToaster = Toaster.create()

AppToaster = Toaster;

var APIResultPlaceholder,
    APIResultView,
    APIViewConsumer,
    APIViewContext,
    PagedAPIView,
    Pagination,
    __APIResultView,
    boundMethodCheck$1 = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};
APIViewContext = createContext({});
APIViewConsumer = APIViewContext.Consumer;

Pagination =
/*#__PURE__*/
function (_Component) {
  _inherits(Pagination, _Component);

  function Pagination() {
    _classCallCheck(this, Pagination);

    return _possibleConstructorReturn(this, _getPrototypeOf(Pagination).apply(this, arguments));
  }

  _createClass(Pagination, [{
    key: "render",
    value: function render() {
      var currentPage, nextDisabled, setPage;
      var _this$props = this.props;
      currentPage = _this$props.currentPage;
      nextDisabled = _this$props.nextDisabled;
      setPage = _this$props.setPage;
      return h(ButtonGroup, [h(Button, {
        onClick: setPage(currentPage - 1),
        icon: 'arrow-left',
        disabled: currentPage <= 0
      }, "Previous"), h(Button, {
        onClick: setPage(currentPage + 1),
        rightIcon: 'arrow-right',
        disabled: nextDisabled
      }, "Next")]);
    }
  }]);

  return Pagination;
}(Component);

APIResultPlaceholder = function APIResultPlaceholder(props) {
  return h('div.api-result-placeholder', [h(Spinner)]);
};

__APIResultView = function () {
  var __APIResultView =
  /*#__PURE__*/
  function (_Component2) {
    _inherits(__APIResultView, _Component2);

    function __APIResultView() {
      var _this;

      _classCallCheck(this, __APIResultView);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(__APIResultView).apply(this, arguments));
      _this.buildURL = _this.buildURL.bind(_assertThisInitialized(_this));
      _this.createDebouncedFunction = _this.createDebouncedFunction.bind(_assertThisInitialized(_this));
      _this.getData = _this.getData.bind(_assertThisInitialized(_this));
      _this.deleteItem = _this.deleteItem.bind(_assertThisInitialized(_this));
      _this.state = {
        data: null
      };

      _this.createDebouncedFunction();

      _this.getData();

      return _this;
    }

    _createClass(__APIResultView, [{
      key: "buildURL",
      value: function buildURL(props) {
        var buildURL, params, route;
        boundMethodCheck$1(this, __APIResultView);

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
        boundMethodCheck$1(this, __APIResultView);
        return this.lazyGetData = debounce(this.getData, this.props.debounce);
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
        var _getData = _asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee() {
          var _onError, data, get, opts, params, route, _this$props2;

          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  boundMethodCheck$1(this, __APIResultView);
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
                  return _context.abrupt("return", this.setState({
                    data: data
                  }));

                case 15:
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
        return h(APIViewContext.Provider, {
          value: value
        }, children(data));
      }
    }, {
      key: "deleteItem",
      value: function () {
        var _deleteItem = _asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee2(data) {
          var err, id, intent, itemRoute, message, primaryKey, res, route, _this$props4, _err;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  boundMethodCheck$1(this, __APIResultView);
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

                  intent = Intent.DANGER;
                  return _context2.abrupt("return", AppToaster.show({
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
  }(Component);
  __APIResultView.contextType = APIContext;
  __APIResultView.defaultProps = {
    route: null,
    params: {},
    opts: {},
    // Options passed to `get`
    debug: false,
    success: console.log,
    primaryKey: 'id',
    // If placeholder is not defined, the render
    // method will be called with null data
    placeholder: APIResultPlaceholder,
    debounce: 300
  };
  return __APIResultView;
}.call(undefined);

APIResultView = function APIResultView(props) {
  var component, ctx; // Enable the use of the APIResultView outside of the APIContext
  // by wrapping it in a placeholder APIContext

  ctx = useContext(APIContext);
  component = h(__APIResultView, props);

  if (ctx.get != null) {
    return component;
  }

  return h(APIProvider, {
    baseURL: ""
  }, component);
};

PagedAPIView = function () {
  var PagedAPIView =
  /*#__PURE__*/
  function (_Component3) {
    _inherits(PagedAPIView, _Component3);

    function PagedAPIView(props) {
      var _this2;

      _classCallCheck(this, PagedAPIView);

      _this2 = _possibleConstructorReturn(this, _getPrototypeOf(PagedAPIView).call(this, props));
      _this2.setPage = _this2.setPage.bind(_assertThisInitialized(_this2));
      _this2.params = _this2.params.bind(_assertThisInitialized(_this2));
      _this2.state = {
        currentPage: 0,
        count: null
      };
      return _this2;
    }

    _createClass(PagedAPIView, [{
      key: "setPage",
      value: function setPage(i) {
        var _this3 = this;

        boundMethodCheck$1(this, PagedAPIView);
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
        boundMethodCheck$1(this, PagedAPIView);
        var _this$props5 = this.props;
        params = _this$props5.params;
        perPage = _this$props5.perPage;
        var _params = params;
        offset = _params.offset;
        limit = _params.limit;
        otherParams = _objectWithoutProperties(_params, ["offset", "limit"]);
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

        return _objectSpread2({
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
        rest = _objectWithoutProperties(_this$props6, ["route", "perPage", "children", "getTotalCount", "primaryKey", "count", "topPagination", "bottomPagination", "extraPagination", "params", "opts"]);
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


        opts = _objectSpread2({}, opts, {
          onResponse: onResponse
        });

        _children = function _children(data) {
          if (_this4.state.count === 0) {
            return h(NonIdealState, {
              icon: 'search',
              title: "No results"
            });
          }

          return children(data);
        };

        return h('div.pagination-container', rest, [topPagination ? this.renderPagination() : void 0, h(APIResultView, {
          route: route,
          params: params,
          opts: opts,
          primaryKey: primaryKey
        }, _children), bottomPagination ? this.renderPagination() : void 0]);
      }
    }]);

    return PagedAPIView;
  }(Component);
  PagedAPIView.defaultProps = {
    count: null,
    perPage: 20,
    topPagination: false,
    bottomPagination: true,
    extraPagination: null,
    opts: {},
    // Options passed to GET
    params: {},
    getTotalCount: function getTotalCount(response) {
      var headers;
      headers = response.headers;
      return parseInt(headers['x-total-count']);
    }
  };
  return PagedAPIView;
}.call(undefined);

var DeleteButton;

DeleteButton = function () {
  var DeleteButton =
  /*#__PURE__*/
  function (_Component) {
    _inherits(DeleteButton, _Component);

    function DeleteButton(props) {
      var _this;

      _classCallCheck(this, DeleteButton);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(DeleteButton).call(this, props));
      _this.state = {
        alertIsShown: false
      };
      return _this;
    }

    _createClass(DeleteButton, [{
      key: "render",
      value: function render() {
        var _this2 = this;

        var alertContent, alertIsShown, handleDelete, icon, intent, itemDescription, onCancel, onClick, rest;
        var _this$props = this.props;
        handleDelete = _this$props.handleDelete;
        alertContent = _this$props.alertContent;
        itemDescription = _this$props.itemDescription;
        rest = _objectWithoutProperties(_this$props, ["handleDelete", "alertContent", "itemDescription"]);
        alertIsShown = this.state.alertIsShown;
        alertContent = ["Are you sure you want to delete ", itemDescription, "?"];

        onCancel = function onCancel() {
          return _this2.setState({
            alertIsShown: false
          });
        };

        onClick = function onClick() {
          return _this2.setState({
            alertIsShown: true
          });
        };

        intent = Intent.DANGER;
        icon = 'trash';
        return h([h(Button, _objectSpread2({
          onClick: onClick,
          icon: icon,
          intent: intent
        }, rest)), h(Alert, {
          isOpen: alertIsShown,
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Delete',
          icon: icon,
          intent: intent,
          onCancel: onCancel,
          onConfirm: function onConfirm() {
            handleDelete();
            return onCancel();
          }
        }, alertContent)]);
      }
    }]);

    return DeleteButton;
  }(Component);
  DeleteButton.defaultProps = {
    handleDelete: function handleDelete() {},
    alertContent: null,
    itemDescription: "this item"
  };
  return DeleteButton;
}.call(undefined);

var LinkButton, NavLinkButton;

LinkButton = withRouter(function (props) {
  var history, location, match, onClick, rest, staticContext, to;
  to = props.to;
  history = props.history;
  staticContext = props.staticContext;
  onClick = props.onClick;
  match = props.match;
  location = props.location;
  rest = _objectWithoutProperties(props, ["to", "history", "staticContext", "onClick", "match", "location"]);

  onClick = function onClick(event) {
    if (to == null) {
      return;
    }

    history.push(to);
    return event.preventDefault();
  };

  return h(AnchorButton, _objectSpread2({
    onClick: onClick
  }, rest));
});

NavLinkButton = function NavLinkButton(props) {
  var className, rest;
  className = props.className;
  rest = _objectWithoutProperties(props, ["className"]);
  className = classNames(className, "bp3-button bp3-minimal");
  return h(NavLink, _objectSpread2({
    className: className
  }, rest));
};

var CancelButton, EditButton, SaveButton;

SaveButton = function SaveButton(props) {
  var className, disabled, icon, inProgress, rest;
  className = props.className;
  inProgress = props.inProgress;
  disabled = props.disabled;
  rest = _objectWithoutProperties(props, ["className", "inProgress", "disabled"]);
  className = classNames(className, 'save-button');
  icon = 'floppy-disk';

  if (inProgress) {
    icon = h(Spinner, {
      size: 20
    });
    disabled = true;
  }

  return h(Button, _objectSpread2({
    icon: icon,
    intent: Intent.SUCCESS,
    className: className,
    disabled: disabled
  }, rest));
};

CancelButton = function CancelButton(props) {
  var className, rest;
  className = props.className;
  rest = _objectWithoutProperties(props, ["className"]);
  className = classNames(className, 'cancel-button');
  return h(Button, _objectSpread2({
    intent: Intent.WARNING,
    className: className
  }, rest));
};

EditButton = function EditButton(props) {
  var className, icon, intent, isEditing, rest;
  isEditing = props.isEditing;
  intent = props.intent;
  icon = props.icon;
  className = props.className;
  rest = _objectWithoutProperties(props, ["isEditing", "intent", "icon", "className"]);

  if (isEditing) {
    if (intent == null) {
      intent = null;
    }

    if (icon == null) {
      icon = 'tick';
    }
  } else {
    if (intent == null) {
      intent = Intent.PRIMARY;
    }

    if (icon == null) {
      icon = 'edit';
    }
  }

  className = classNames(className, 'edit-button');
  return h(Button, _objectSpread2({
    icon: icon,
    intent: intent,
    className: className
  }, rest));
};

function _templateObject() {
  var data = _taggedTemplateLiteral([".bp3-button-text {\n  flex-grow: 1;\n  display: flex;\n}\n.bp3-button-text * {\n  display: inline;\n}\nspan.expander {\n  flex-grow: 1;\n}"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

// This component should be refactored into a shared UI component
var CollapsePanel, HeaderButton;
HeaderButton = styled(Button)(_templateObject());

CollapsePanel = function () {
  var CollapsePanel =
  /*#__PURE__*/
  function (_Component) {
    _inherits(CollapsePanel, _Component);

    function CollapsePanel(props) {
      var _this;

      _classCallCheck(this, CollapsePanel);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(CollapsePanel).call(this, props));
      _this.state = {
        isOpen: false
      };
      return _this;
    }

    _createClass(CollapsePanel, [{
      key: "componentWillMount",
      value: function componentWillMount() {
        var isOpen, storageID; // Set open state from local storage if it is available

        storageID = this.props.storageID;

        if (storageID == null) {
          return;
        }

        isOpen = this.savedState()[storageID];

        if (isOpen == null) {
          return;
        }

        return this.setState({
          isOpen: isOpen
        });
      }
      /*
      Next functions are for state management
      across pages, if storageID prop is passed
      */

    }, {
      key: "savedState",
      value: function savedState() {
        var st;

        try {
          st = window.localStorage.getItem('collapse-panel-state');
          return JSON.parse(st) || {};
        } catch (error) {
          return {};
        }
      }
    }, {
      key: "checkLocalStorage",
      value: function checkLocalStorage() {
        var isOpen, storageID; // Set open state from local storage if it is available

        storageID = this.props.storageID;

        if (storageID == null) {
          return;
        }

        isOpen = this.savedState()[storageID] || null;

        if (isOpen == null) {
          isOpen = false;
        }

        return this.setState({
          isOpen: isOpen
        });
      }
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate(prevProps, prevState) {
        var isOpen, j, s, storageID; // Refresh object in local storage

        storageID = this.props.storageID;

        if (storageID == null) {
          return;
        }

        isOpen = this.state.isOpen;

        if (isOpen === prevState.isOpen) {
          return;
        }

        s = this.savedState();
        s[storageID] = isOpen;
        j = JSON.stringify(s);
        return window.localStorage.setItem('collapse-panel-state', j);
      }
    }, {
      key: "render",
      value: function render() {
        var _this2 = this;

        var children, headerRight, icon, isOpen, onClick, props, storageID, title;
        var _this$props = this.props;
        title = _this$props.title;
        children = _this$props.children;
        storageID = _this$props.storageID;
        headerRight = _this$props.headerRight;
        props = _objectWithoutProperties(_this$props, ["title", "children", "storageID", "headerRight"]);
        isOpen = this.state.isOpen;
        icon = isOpen ? 'collapse-all' : 'expand-all';

        onClick = function onClick() {
          return _this2.setState({
            isOpen: !isOpen
          });
        };

        if (headerRight == null) {
          headerRight = null;
        }

        return h('div.collapse-panel', props, [h('div.panel-header', [h(HeaderButton, {
          icon: icon,
          minimal: true,
          onClick: onClick,
          fill: true
        }, [h('h2', title), h('span.expander')]), headerRight]), h(Collapse, {
          isOpen: isOpen
        }, children)]);
      }
    }]);

    return CollapsePanel;
  }(Component);
  CollapsePanel.defaultProps = {
    title: "Panel",
    // `storageID` prop allows storage of state in
    // localStorage or equivalent.
    storageID: null
  };
  return CollapsePanel;
}.call(undefined);

var LinkCard;

LinkCard = function LinkCard(props) {
  var className, href, inner, rest, target, to;
  to = props.to;
  href = props.href;
  target = props.target;
  rest = _objectWithoutProperties(props, ["to", "href", "target"]);
  className = "link-card";
  inner = h(Card, _objectSpread2({}, rest));

  if (to == null) {
    return h('a', {
      href: href,
      target: target,
      className: className
    }, inner);
  }

  return h(Link, {
    to: to,
    className: className
  }, inner);
};

var FileList,
    FileListItem,
    FileUploadComponent,
    boundMethodCheck$2 = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};

FileListItem = function FileListItem(props) {
  var file;
  file = props.file;
  return h(Tag, {
    icon: 'document'
  }, file.name);
};

FileList = function FileList(props) {
  var files, placeholder;
  files = props.files;
  placeholder = props.placeholder;

  if (placeholder == null) {
    placeholder = "Choose file...";
  }

  if (!(files != null && files.length > 0)) {
    return placeholder;
  }

  return h('div.files', files.map(function (file) {
    return h(FileListItem, {
      file: file
    });
  }));
};

FileUploadComponent = function () {
  var FileUploadComponent =
  /*#__PURE__*/
  function (_Component) {
    _inherits(FileUploadComponent, _Component);

    function FileUploadComponent() {
      var _this;

      _classCallCheck(this, FileUploadComponent);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(FileUploadComponent).apply(this, arguments));
      _this.renderDropzone = _this.renderDropzone.bind(_assertThisInitialized(_this));
      return _this;
    }

    _createClass(FileUploadComponent, [{
      key: "renderDropzone",
      value: function renderDropzone(_ref) {
        var getRootProps = _ref.getRootProps,
            getInputProps = _ref.getInputProps,
            isDragActive = _ref.isDragActive;
        var className, files, inputProps, msg, rootProps;
        boundMethodCheck$2(this, FileUploadComponent);
        files = this.props.files;
        rootProps = getRootProps();
        className = classNames('file-upload', {
          'dropzone-active': isDragActive
        });
        inputProps = getInputProps();
        inputProps.style = {};
        inputProps.className = 'bp3-large';
        msg = 'Drop files here';

        if (!isDragActive) {
          msg += ", or click to upload";
        }

        return h('div', _objectSpread2({
          className: className
        }, rootProps), [h('label.bp3-file-input.bp3-large', [h('input', inputProps), h('div.bp3-file-upload-input', [h(FileList, {
          files: files,
          placeholder: msg
        })])])]);
      }
    }, {
      key: "render",
      value: function render() {
        return h(Dropzone, {
          onDrop: this.props.onAddFile,
          onFileDialogCancel: this.props.onCancel
        }, this.renderDropzone);
      }
    }]);

    return FileUploadComponent;
  }(Component);
  /*
  An elaboration of the file upload component
  from BlueprintJS with file drop zone capability
  */

  FileUploadComponent.defaultProps = {
    onAddFile: function onAddFile() {},
    onCancel: function onCancel() {}
  };
  return FileUploadComponent;
}.call(undefined);

var ConfinedImage;

ConfinedImage =
/*#__PURE__*/
function (_Component) {
  _inherits(ConfinedImage, _Component);

  function ConfinedImage(props) {
    var _this;

    _classCallCheck(this, ConfinedImage);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(ConfinedImage).call(this, props));
    _this.state = {
      imageSize: null
    };
    return _this;
  }

  _createClass(ConfinedImage, [{
    key: "render",
    value: function render() {
      var imageSize, imgStyle, maxHeight, maxWidth, src, style;
      var _this$props = this.props;
      maxHeight = _this$props.maxHeight;
      maxWidth = _this$props.maxWidth;
      src = _this$props.src;
      imageSize = this.state.imageSize;

      if (maxHeight == null) {
        maxHeight = 200;
      }

      if (maxWidth == null) {
        maxWidth = 200;
      }

      if (imageSize != null) {
        if (maxHeight > imageSize.height) {
          maxHeight = imageSize.height;
        }

        if (maxWidth > imageSize.width) {
          maxWidth = imageSize.width;
        }
      }

      imgStyle = {
        maxHeight: maxHeight,
        maxWidth: maxWidth
      };
      style = {
        maxHeight: maxHeight,
        maxWidth: maxWidth
      };
      return h('div.image-container', {
        style: style
      }, [h('img', {
        src: src,
        style: imgStyle
      })]);
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      var el, img;
      el = findDOMNode(this);
      img = el.querySelector('img');
      return img.onload = function () {
        var height, width;
        height = img.naturalHeight / 2;
        width = img.naturalWidth / 2;
        return _this2.setState({
          imageSize: {
            height: height,
            width: width
          }
        });
      };
    }
  }]);

  return ConfinedImage;
}(Component);

var StatefulComponent,
    boundMethodCheck$3 = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};

StatefulComponent =
/*#__PURE__*/
function (_Component) {
  _inherits(StatefulComponent, _Component);

  function StatefulComponent() {
    var _this;

    _classCallCheck(this, StatefulComponent);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(StatefulComponent).apply(this, arguments));
    _this.updateState = _this.updateState.bind(_assertThisInitialized(_this));
    return _this;
  }

  _createClass(StatefulComponent, [{
    key: "updateState",
    value: function updateState(spec) {
      var newState;
      boundMethodCheck$3(this, StatefulComponent);
      newState = update(this.state, spec);
      return this.setState(newState);
    }
  }]);

  return StatefulComponent;
}(Component);

var EditableDateField,
    EditableField,
    ModelEditButton,
    ModelEditor,
    ModelEditorContext,
    boundMethodCheck$4 = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};
ModelEditorContext = createContext({});

ModelEditButton = function () {
  var ModelEditButton =
  /*#__PURE__*/
  function (_Component) {
    _inherits(ModelEditButton, _Component);

    function ModelEditButton() {
      _classCallCheck(this, ModelEditButton);

      return _possibleConstructorReturn(this, _getPrototypeOf(ModelEditButton).apply(this, arguments));
    }

    _createClass(ModelEditButton, [{
      key: "render",
      value: function render() {
        var actions, isEditing;
        var _this$context = this.context;
        isEditing = _this$context.isEditing;
        actions = _this$context.actions;
        return h(EditButton, _objectSpread2({
          isEditing: isEditing,
          onClick: actions.toggleEditing
        }, this.props));
      }
    }]);

    return ModelEditButton;
  }(Component);
  ModelEditButton.contextType = ModelEditorContext;
  return ModelEditButton;
}.call(undefined);

ModelEditor = function () {
  var ModelEditor =
  /*#__PURE__*/
  function (_StatefulComponent) {
    _inherits(ModelEditor, _StatefulComponent);

    function ModelEditor(props) {
      var _this;

      _classCallCheck(this, ModelEditor);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(ModelEditor).call(this, props));
      _this.getValue = _this.getValue.bind(_assertThisInitialized(_this));
      _this.hasChanges = _this.hasChanges.bind(_assertThisInitialized(_this));
      _this.onChange = _this.onChange.bind(_assertThisInitialized(_this));
      _this.toggleEditing = _this.toggleEditing.bind(_assertThisInitialized(_this));
      _this.state = {
        isEditing: false,
        error: null,
        data: props.data,
        initialData: props.data
      };
      return _this;
    }

    _createClass(ModelEditor, [{
      key: "render",
      value: function render() {
        var _this2 = this;

        var actions, data, isEditing, value;
        var _this$state = this.state;
        data = _this$state.data;
        isEditing = _this$state.isEditing;

        actions = function () {
          var _this3;

          var onChange, toggleEditing, updateState;
          return _this3 = _this2, onChange = _this3.onChange, toggleEditing = _this3.toggleEditing, updateState = _this3.updateState, _this3;
        }();

        value = {
          actions: actions,
          data: data,
          isEditing: isEditing,
          hasChanges: this.hasChanges
        };
        console.log(value);
        return h(ModelEditorContext.Provider, {
          value: value
        }, this.props.children);
      }
    }, {
      key: "getValue",
      value: function getValue(field) {
        boundMethodCheck$4(this, ModelEditor);
        return this.state.data[field];
      }
    }, {
      key: "hasChanges",
      value: function hasChanges() {
        boundMethodCheck$4(this, ModelEditor);
        return this.props.data !== this.state.data;
      }
    }, {
      key: "onChange",
      value: function onChange(field) {
        var _this4 = this;

        boundMethodCheck$4(this, ModelEditor);
        return function (value) {
          var data;
          data = {};
          data[field] = {
            $set: value
          };
          return _this4.updateState({
            data: data
          });
        };
      }
    }, {
      key: "toggleEditing",
      value: function toggleEditing() {
        boundMethodCheck$4(this, ModelEditor);
        return this.updateState({
          $toggle: ['isEditing']
        });
      }
    }, {
      key: "componentDidUpdate",
      value: function componentDidUpdate(prevProps) {
        if (this.props.data !== prevProps.data) {
          return this.updateState({
            initialData: {
              $set: this.props.data
            }
          });
        }
      }
    }]);

    return ModelEditor;
  }(StatefulComponent);
  ModelEditor.EditButton = ModelEditButton;
  return ModelEditor;
}.call(undefined);

EditableField = function () {
  var EditableField =
  /*#__PURE__*/
  function (_Component2) {
    _inherits(EditableField, _Component2);

    function EditableField() {
      _classCallCheck(this, EditableField);

      return _possibleConstructorReturn(this, _getPrototypeOf(EditableField).apply(this, arguments));
    }

    _createClass(EditableField, [{
      key: "render",
      value: function render() {
        var actions, className, data, field, isEditing, onChange, value;
        var _this$props = this.props;
        field = _this$props.field;
        className = _this$props.className;
        var _this$context2 = this.context;
        actions = _this$context2.actions;
        data = _this$context2.data;
        isEditing = _this$context2.isEditing;
        value = data[field];
        onChange = actions.onChange(field);
        className = classNames(className, "field-".concat(field));

        if (isEditing) {
          value = h(EditableText, {
            placeholder: "Edit ".concat(field),
            multiline: true,
            className: className,
            onChange: onChange,
            value: value
          });
        }

        return h('div.text', {
          className: className
        }, value);
      }
    }]);

    return EditableField;
  }(Component);
  EditableField.contextType = ModelEditorContext;
  return EditableField;
}.call(undefined);

EditableDateField = function () {
  var EditableDateField =
  /*#__PURE__*/
  function (_Component3) {
    _inherits(EditableDateField, _Component3);

    function EditableDateField() {
      _classCallCheck(this, EditableDateField);

      return _possibleConstructorReturn(this, _getPrototypeOf(EditableDateField).apply(this, arguments));
    }

    _createClass(EditableDateField, [{
      key: "render",
      value: function render() {
        var actions, data, field, isEditing, value;
        field = this.props.field;
        var _this$context3 = this.context;
        actions = _this$context3.actions;
        data = _this$context3.data;
        isEditing = _this$context3.isEditing;
        value = data[field];

        if (!isEditing) {
          return h('div.date-input.disabled', value);
        }

        return h(DateInput, {
          className: 'date-input',
          value: new Date(value),
          formatDate: function formatDate(date) {
            return date.toLocaleDateString();
          },
          placeholder: "MM/DD/YYYY",
          showActionsBar: true,
          onChange: actions.onChange(field),
          parseDate: function parseDate(d) {
            return new Date(d);
          }
        });
      }
    }]);

    return EditableDateField;
  }(Component);
  EditableDateField.contextType = ModelEditorContext;
  return EditableDateField;
}.call(undefined);

var AuthorList, GDDReferenceCard, GeoDeepDiveSwatchInner, VolumeNumber;

AuthorList = function AuthorList(props) {
  var _, author, authors, etAl, i, isLast, ix, len, name, newName;

  authors = props.authors;

  if (authors.length >= 4) {
    authors = authors.slice(0, 2);
    etAl = ' et al.';
  }

  _ = [];

  for (ix = i = 0, len = authors.length; i < len; ix = ++i) {
    author = authors[ix];

    try {
      name = author.name.split(',');
      newName = name[1].trim() + " " + name[0].trim();
    } catch (error) {
      name = author.name;
    }

    isLast = ix === authors.length - 1 && etAl == null;

    if (isLast) {
      _.pop();

      _.push(' and ');
    }

    _.push(h('span.author', name));

    if (!isLast) {
      _.push(', ');
    }
  }

  if (etAl != null) {
    _.pop();

    _.push(etAl);
  }

  return h('span.authors', _);
};

VolumeNumber = function VolumeNumber(props) {
  var _, number, volume;

  volume = props.volume;
  number = props.number;
  _ = [];

  if (volume != null && volume !== "") {
    _.push(h('span.volume', null, volume));
  }

  if (number != null && number !== "") {
    _.push("(");

    _.push(h('span.number', number));

    _.push(")");
  }

  if (_.length === 0) {
    return null;
  }

  _.push(", ");

  return h('span', null, _);
};

GeoDeepDiveSwatchInner =
/*#__PURE__*/
function (_Component) {
  _inherits(GeoDeepDiveSwatchInner, _Component);

  function GeoDeepDiveSwatchInner() {
    _classCallCheck(this, GeoDeepDiveSwatchInner);

    return _possibleConstructorReturn(this, _getPrototypeOf(GeoDeepDiveSwatchInner).apply(this, arguments));
  }

  _createClass(GeoDeepDiveSwatchInner, [{
    key: "render",
    value: function render() {
      var author, doi, identifier, journal, link, number, title, url, volume, year;
      var _this$props = this.props;
      title = _this$props.title;
      author = _this$props.author;
      doi = _this$props.doi;
      link = _this$props.link;
      journal = _this$props.journal;
      identifier = _this$props.identifier;
      volume = _this$props.volume;
      number = _this$props.number;
      year = _this$props.year;

      try {
        var _link$find = link.find(function (d) {
          return d.type === 'publisher';
        });

        url = _link$find.url;
      } catch (error) {
        url = null;
      }

      try {
        var _identifier$find = identifier.find(function (d) {
          return d.type === 'doi';
        });

        doi = _identifier$find.id;
      } catch (error) {
        doi = null;
      }

      return h(LinkCard, {
        href: url,
        target: '_blank',
        interactive: true,
        className: 'gdd-article'
      }, [h(AuthorList, {
        authors: author
      }), ", ", h('span.title', title), ", ", h('span.journal', journal), ", ", h(VolumeNumber, {
        volume: volume,
        number: number
      }), h('span.year', year), ", ", h('span.doi-title', 'doi: '), h('span.doi', doi)]);
    }
  }]);

  return GeoDeepDiveSwatchInner;
}(Component);

GDDReferenceCard =
/*#__PURE__*/
function (_Component2) {
  _inherits(GDDReferenceCard, _Component2);

  function GDDReferenceCard() {
    _classCallCheck(this, GDDReferenceCard);

    return _possibleConstructorReturn(this, _getPrototypeOf(GDDReferenceCard).apply(this, arguments));
  }

  _createClass(GDDReferenceCard, [{
    key: "render",
    value: function render() {
      var docid;
      docid = this.props.docid;
      return h(APIResultView, {
        route: "http://geodeepdive.org/api/articles",
        params: {
          docid: docid
        },
        opts: {
          unwrapResponse: function unwrapResponse(res) {
            return res.success.data[0];
          },
          memoize: true,
          onError: console.error
        }
      }, function (data) {
        try {
          return h(GeoDeepDiveSwatchInner, data);
        } catch (error) {
          return null;
        }
      });
    }
  }]);

  return GDDReferenceCard;
}(Component);

var HTML, Markdown;

Markdown = function Markdown(_ref) {
  var src = _ref.src,
      rest = _objectWithoutProperties(_ref, ["src"]);

  return h('div', {
    dangerouslySetInnerHTML: _objectSpread2({
      __html: src
    }, rest)
  });
};

HTML = Markdown;

export { APIConsumer, APIContext, APIProvider, APIResultView, APIViewConsumer, APIViewContext, AppToaster, CancelButton, CollapsePanel, ConfinedImage, DeleteButton, EditButton, EditableDateField, EditableField, FileUploadComponent, GDDReferenceCard, HTML, LinkButton, LinkCard, Markdown, ModelEditor, ModelEditorContext, NavLinkButton, PagedAPIView, SaveButton, StatefulComponent, buildQueryString };

import { slicedToArray as _slicedToArray, inherits as _inherits, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf, assertThisInitialized as _assertThisInitialized, createClass as _createClass, objectWithoutProperties as _objectWithoutProperties, objectSpread2 as _objectSpread2, asyncToGenerator as _asyncToGenerator } from '../_virtual/_rollupPluginBabelHelpers.js';
import { createContext, useState, useContext, Component } from 'react';
import h from 'react-hyperscript';
import { memoize } from 'underscore';
import axios from 'axios';
import useAsyncEffect from 'use-async-effect';

var APIConsumer,
    APIContext,
    APIProvider,
    buildQueryString,
    useAPIResult,
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
          buildQueryString: buildQueryString,
          processOptions: this.processOptions
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
      value: function post() {
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
        return this.runQuery(axios.post(url, payload), route, url, "POST", opts);
      }
    }, {
      key: "get",
      value: function get(route, params, opts) {
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
        fn = axios.get;

        if (opts.memoize) {
          fn = memoize(axios.get);
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
                  debugger;

                  if (opts.handleError) {
                    _context.next = 20;
                    break;
                  }

                  throw err;

                case 20:
                  console.error(err);
                  onError(route, {
                    error: err,
                    response: res,
                    endpoint: url,
                    method: method
                  });
                  return _context.abrupt("return", Promise.resolve(null));

                case 23:
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

useAPIResult = function useAPIResult(route, params, onResponse, deps) {
  var get, getAPIData, result, setResult;
  /*
  React hook for API results
  */

  if (arguments.length === 3) {
    deps = onResponse;
    onResponse = null;
  }

  if (deps == null) {
    deps = [];
  }

  if (onResponse == null) {
    onResponse = function onResponse(d) {
      return d;
    };
  }

  var _useState = useState(null);

  var _useState2 = _slicedToArray(_useState, 2);

  result = _useState2[0];
  setResult = _useState2[1];

  var _useContext = useContext(APIContext);

  get = _useContext.get;

  getAPIData =
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var opts, res;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return get(route, params, opts = {});

            case 2:
              res = _context2.sent;
              return _context2.abrupt("return", setResult(onResponse(res)));

            case 4:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function getAPIData() {
      return _ref.apply(this, arguments);
    };
  }();

  useAsyncEffect(getAPIData, deps);
  return result;
};

export { APIConsumer, APIContext, APIProvider, buildQueryString, useAPIResult };
//# sourceMappingURL=api.js.map

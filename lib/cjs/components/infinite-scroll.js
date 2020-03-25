'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var __chunk_2 = require('./api.js');
var core = require('@blueprintjs/core');
var InfiniteScroll = _interopDefault(require('react-infinite-scroller'));
var __chunk_5 = require('./util/stateful.js');
var __chunk_6 = require('./util/hooks.js');

var __InfiniteScrollResultView;

__InfiniteScrollResultView = function __InfiniteScrollResultView(props) {
  /*
  A container for cursor-based pagination. This is built for
  the GeoDeepDive API right now, but it can likely be generalized
  for other uses.
  */
  var children, get, getInitialData, loadNext, main, opts, params, route, scrollId, state, unwrapResponse, updateState;
  route = props.route;
  params = props.params;
  opts = props.opts;
  unwrapResponse = props.unwrapResponse;
  children = props.children;

  var _useContext = react.useContext(__chunk_2.APIContext);

  get = _useContext.get;

  var _useImmutableState = __chunk_5.useImmutableState({
    items: [],
    scrollId: null,
    count: null,
    error: null
  });

  var _useImmutableState2 = __chunk_1.slicedToArray(_useImmutableState, 2);

  state = _useImmutableState2[0];
  updateState = _useImmutableState2[1];
  var _state = state;
  scrollId = _state.scrollId;

  getInitialData =
  /*#__PURE__*/
  function () {
    var _ref = __chunk_1.asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      var data, hits, success, _success;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return get(route, params, __chunk_1.objectSpread2({
                unwrapResponse: unwrapResponse
              }, opts));

            case 2:
              success = _context.sent;
              _success = success;
              data = _success.data;
              scrollId = _success.scrollId;
              hits = _success.hits;
              updateState({
                items: {
                  $set: data
                },
                scrollId: {
                  $set: scrollId
                },
                count: {
                  $set: hits
                }
              });

            case 8:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    return function getInitialData() {
      return _ref.apply(this, arguments);
    };
  }();

  loadNext =
  /*#__PURE__*/
  function () {
    var _ref2 = __chunk_1.asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2() {
      var data, _ref3;

      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!(scrollId != null)) {
                _context2.next = 11;
                break;
              }

              if (!(scrollId === "")) {
                _context2.next = 3;
                break;
              }

              return _context2.abrupt("return");

            case 3:
              _context2.next = 5;
              return get(route, {
                scroll_id: scrollId
              }, __chunk_1.objectSpread2({
                unwrapResponse: unwrapResponse
              }, opts));

            case 5:
              _ref3 = _context2.sent;
              data = _ref3.data;
              scrollId = _ref3.scrollId;
              return _context2.abrupt("return", updateState({
                items: {
                  $push: data
                },
                scrollId: {
                  $set: scrollId
                }
              }));

            case 11:
              return _context2.abrupt("return", getInitialData());

            case 12:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function loadNext() {
      return _ref2.apply(this, arguments);
    };
  }();

  __chunk_6.useAsyncEffect(getInitialData, [route, params]);
  main = null;

  try {
    main = h(children, state);
  } catch (error) {
    main = children(state);
  }

  return h(InfiniteScroll, {
    pageStart: 0,
    loadMore: loadNext,
    hasMore: scrollId != null && scrollId !== "",
    loader: h(core.Spinner)
  }, main);
};

exports.InfiniteScrollResultView = function InfiniteScrollResultView(props) {
  var component, ctx; // Enable the use of the APIResultView outside of the APIContext
  // by wrapping it in a placeholder APIContext

  ctx = react.useContext(__chunk_2.APIContext);
  component = h(__InfiniteScrollResultView, props);

  if (ctx.get != null) {
    return component;
  }

  return h(__chunk_2.APIProvider, {
    baseURL: ""
  }, component);
};
//# sourceMappingURL=infinite-scroll.js.map

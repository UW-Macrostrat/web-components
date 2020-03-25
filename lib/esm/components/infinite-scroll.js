import { slicedToArray as _slicedToArray, asyncToGenerator as _asyncToGenerator, objectSpread2 as _objectSpread2 } from '../_virtual/_rollupPluginBabelHelpers.js';
import { useContext } from 'react';
import h from 'react-hyperscript';
import { APIContext, APIProvider } from './api.js';
import { Spinner } from '@blueprintjs/core';
import InfiniteScroll from 'react-infinite-scroller';
import { useImmutableState } from './util/stateful.js';
import { useAsyncEffect } from './util/hooks.js';

var InfiniteScrollResultView, __InfiniteScrollResultView;

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

  var _useContext = useContext(APIContext);

  get = _useContext.get;

  var _useImmutableState = useImmutableState({
    items: [],
    scrollId: null,
    count: null,
    error: null
  });

  var _useImmutableState2 = _slicedToArray(_useImmutableState, 2);

  state = _useImmutableState2[0];
  updateState = _useImmutableState2[1];
  var _state = state;
  scrollId = _state.scrollId;

  getInitialData =
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee() {
      var data, hits, success, _success;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return get(route, params, _objectSpread2({
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
    var _ref2 = _asyncToGenerator(
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
              }, _objectSpread2({
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

  useAsyncEffect(getInitialData, [route, params]);
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
    loader: h(Spinner)
  }, main);
};

InfiniteScrollResultView = function InfiniteScrollResultView(props) {
  var component, ctx; // Enable the use of the APIResultView outside of the APIContext
  // by wrapping it in a placeholder APIContext

  ctx = useContext(APIContext);
  component = h(__InfiniteScrollResultView, props);

  if (ctx.get != null) {
    return component;
  }

  return h(APIProvider, {
    baseURL: ""
  }, component);
};

export { InfiniteScrollResultView };
//# sourceMappingURL=infinite-scroll.js.map

/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Component, createContext, useState, useContext} from 'react';
import h from 'react-hyperscript';
import {memoize} from 'underscore';
import axios from 'axios';
import useAsyncEffect from 'use-async-effect';

const APIContext = createContext({});
const APIConsumer = APIContext.Consumer;

const buildQueryString = params=> {
  if (params == null) { params = {}; }
  let p = new URLSearchParams(params).toString();
  if (p !== "") {
    p = "?"+p;
  }
  return p;
};

class APIProvider extends Component {
  constructor(props) {
    super(props);
    this.buildURL = this.buildURL.bind(this);
    this.post = this.post.bind(this);
    this.get = this.get.bind(this);
    this.processOptions = this.processOptions.bind(this);
  }

  static initClass() {
    this.defaultProps = {
      baseURL: "/api",
      unwrapResponse(res){ return res; },
      onError(route, opts){
        // This is a non-intuitive signature
        let {error} = opts;
        if ((error == null)) {
          error = opts;
        }
        throw error;
      }
    };
  }
  render() {
    const {baseURL, unwrapResponse, onError, ...rest} = this.props;
    const helpers = {buildURL: this.buildURL, buildQueryString, processOptions: this.processOptions};
    const actions = {post: this.post, get: this.get};
    const value = {...rest, ...actions, helpers, baseURL, onError};
    return h(APIContext.Provider, {value}, this.props.children);
  }

  buildURL(route, params){
    if (params == null) { params = {}; }
    const {baseURL} = this.props;
    if (route == null) { return null; }
    console.log(route);

    if (!(route.startsWith(baseURL) || route.startsWith('http'))) {
      route = baseURL+route;
    }
    route += buildQueryString(params);
    return route;
  }

  post() {
    let opts, params, payload, route;
    if (arguments.length === 4) {
      [route, params, payload, opts] = arguments;
    } else if (arguments.length === 3) {
      [route, payload, opts] = arguments;
    } else if (arguments.length === 2) {
      [route, payload] = arguments;
    } else {
      throw "No data to post";
    }
    if (opts == null) { opts = {}; }
    if (params == null) { params = {}; }

    const url = this.buildURL(route, params);
    opts = this.processOptions(opts);

    return this.runQuery(axios.post(url, payload), route, url, "POST", opts);
  }

  get(route, params, opts){
    if (params == null) { params = {}; }
    if ((opts == null)) {
      opts = params;
      params = {};
    }

    const url = this.buildURL(route, params);
    opts = this.processOptions(opts);

    let fn = axios.get;
    if (opts.memoize) {
      fn = memoize(axios.get);
    }

    return this.runQuery(fn(url), route, url, "GET", opts);
  }

  async runQuery(promise, route, url, method, opts) {
    let res;
    const {onError} = opts;
    try {
      res = await promise;
      opts.onResponse(res);
      const {data} = res;
      if ((data == null)) {
        throw res.error || "No data!";
      }
      return opts.unwrapResponse(data);
    } catch (err) {
      if (!opts.handleError) {
        throw err;
      }
      console.error(err);
      onError(route, {
        error:err,
        response: res,
        endpoint: url,
        method
      });
      return Promise.resolve(null);
    }
  };

  processOptions(opts){
    // Standardize option values
    // (some props can be passed as options)
    if (opts == null) { opts = {}; }
    if (opts.fullResponse == null) { opts.fullResponse = false; }
    if (opts.handleError == null) { opts.handleError = true; }
    if (opts.memoize == null) { opts.memoize = false; }
    if (opts.onError == null) { opts.onError = this.props.onError; }
    // Run some side effects with the response (e.g. process headers)
    if (opts.onResponse == null) { opts.onResponse = function() {}; }
    if (opts.unwrapResponse == null) { opts.unwrapResponse = this.props.unwrapResponse; }

    if (opts.fullResponse) {
      opts.unwrapResponse = data => data;
    }

    return opts;
  }
}
APIProvider.initClass();

const useAPIResult = function(route, params, onResponse, deps){
  /*
  React hook for API results
  */
  if (arguments.length === 3) {
    deps = onResponse;
    onResponse = null;
  }
  if (deps == null) { deps = []; }
  if (onResponse == null) { onResponse = d => d; }

  const [result, setResult] = useState(null);
  const {get} = useContext(APIContext);
  const getAPIData = async function() {
    let opts;
    const res = await get(route, params, (opts={}));
    return setResult(onResponse(res));
  };

  useAsyncEffect(getAPIData, deps);
  return result;
};

export {
  APIContext,
  APIProvider,
  APIConsumer,
  buildQueryString,
  useAPIResult
};

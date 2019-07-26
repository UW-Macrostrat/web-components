import { createContext, Component } from 'react';
import h from 'react-hyperscript';
import { memoize } from 'underscore';
import { post, get } from 'axios';

var APIConsumer, APIContext, APIProvider, buildQueryString,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

APIContext = createContext({});

APIConsumer = APIContext.Consumer;

buildQueryString = (params = {}) => {
  var p;
  p = new URLSearchParams(params).toString();
  if (p !== "") {
    p = "?" + p;
  }
  return p;
};

APIProvider = (function() {
  class APIProvider extends Component {
    constructor() {
      super(...arguments);
      this.buildURL = this.buildURL.bind(this);
      this.post = this.post.bind(this);
      this.get = this.get.bind(this);
      this.runQuery = this.runQuery.bind(this);
      this.processOptions = this.processOptions.bind(this);
    }

    render() {
      var actions, baseURL, helpers, onError, rest, unwrapResponse, value;
      ({baseURL, unwrapResponse, onError, ...rest} = this.props);
      helpers = {
        buildURL: this.buildURL,
        buildQueryString
      };
      actions = {
        post: this.post,
        get: this.get
      };
      value = {...rest, ...actions, helpers, baseURL, onError};
      return h(APIContext.Provider, {value}, this.props.children);
    }

    buildURL(route, params = {}) {
      var baseURL;
      boundMethodCheck(this, APIProvider);
      ({baseURL} = this.props);
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

    post() {
      var opts, params, payload, route, url;
      boundMethodCheck(this, APIProvider);
      if (arguments.length === 4) {
        [route, params, payload, opts] = arguments;
      } else if (arguments.length === 3) {
        [route, payload, opts] = arguments;
      } else if (arguments.length === 2) {
        [route, payload] = arguments;
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

    get(route, params, opts) {
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

    async runQuery(promise, route, url, method, opts) {
      var data, err, onError, res;
      boundMethodCheck(this, APIProvider);
      ({onError} = opts);
      try {
        res = (await promise);
        opts.onResponse(res);
        ({data} = res);
        if (data == null) {
          throw res.error || "No data!";
        }
        return opts.unwrapResponse(data);
      } catch (error1) {
        err = error1;
        if (!opts.handleError) {
          throw err;
        }
        console.error(err);
        onError(route, {
          error: err,
          response: res,
          endpoint: url,
          method
        });
        return null;
      }
    }

    processOptions(opts = {}) {
      boundMethodCheck(this, APIProvider);
      // Standardize option values
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
      }
      // Run some side effects with the response (e.g. process headers)
      if (opts.onResponse == null) {
        opts.onResponse = function() {};
      }
      if (opts.unwrapResponse == null) {
        opts.unwrapResponse = this.props.unwrapResponse;
      }
      if (opts.fullResponse) {
        opts.unwrapResponse = function(data) {
          return data;
        };
      }
      return opts;
    }

  }
  APIProvider.defaultProps = {
    baseURL: "/api",
    unwrapResponse: function(res) {
      return res;
    },
    onError: function(route, opts) {
      var error;
      // This is a non-intuitive signature
      ({error} = opts);
      if (error == null) {
        error = opts;
      }
      throw error;
    }
  };

  return APIProvider;

}).call(undefined);

export { APIConsumer, APIContext, APIProvider, buildQueryString };

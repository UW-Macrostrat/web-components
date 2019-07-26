import { createContext, Component } from 'react';
import h from 'react-hyperscript';
import { memoize, debounce } from 'underscore';
import axios, { post, get } from 'axios';
import { Toaster, Spinner, Intent, ButtonGroup, Button, NonIdealState, Alert, AnchorButton, Collapse, Card, Tag, EditableText } from '@blueprintjs/core';
import ReactJson from 'react-json-view';
import classNames from 'classnames';
import { withRouter, NavLink, Link } from 'react-router-dom';
import styled from '@emotion/styled';
import Dropzone from 'react-dropzone';
import { findDOMNode } from 'react-dom';
import { DateInput } from '@blueprintjs/datetime';
import update from 'immutability-helper';

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

var AppToaster;

// We might want to refactor this
AppToaster = Toaster.create();

var APIResultPlaceholder, APIResultView, APIViewConsumer, APIViewContext, PagedAPIView, Pagination,
  boundMethodCheck$1 = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

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
      boundMethodCheck$1(this, APIResultView);
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
      boundMethodCheck$1(this, APIResultView);
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
      boundMethodCheck$1(this, APIResultView);
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
      boundMethodCheck$1(this, PagedAPIView);
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
      boundMethodCheck$1(this, PagedAPIView);
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

var DeleteButton;

DeleteButton = (function() {
  class DeleteButton extends Component {
    constructor(props) {
      super(props);
      this.state = {
        alertIsShown: false
      };
    }

    render() {
      var alertContent, alertIsShown, handleDelete, icon, intent, itemDescription, onCancel, onClick, rest;
      ({handleDelete, alertContent, itemDescription, ...rest} = this.props);
      ({alertIsShown} = this.state);
      alertContent = ["Are you sure you want to delete ", itemDescription, "?"];
      onCancel = () => {
        return this.setState({
          alertIsShown: false
        });
      };
      onClick = () => {
        return this.setState({
          alertIsShown: true
        });
      };
      intent = Intent.DANGER;
      icon = 'trash';
      return h('div.delete-control', [
        h(Alert,
        {
          isOpen: alertIsShown,
          cancelButtonText: 'Cancel',
          confirmButtonText: 'Delete',
          icon,
          intent,
          onCancel,
          onConfirm: () => {
            handleDelete();
            return onCancel();
          }
        },
        alertContent),
        h(Button,
        {onClick,
        icon,
        intent,
        ...rest})
      ]);
    }

  }
  DeleteButton.defaultProps = {
    handleDelete: function() {},
    alertContent: null,
    itemDescription: "this item"
  };

  return DeleteButton;

}).call(undefined);

var LinkButton, NavLinkButton;

// Button that forms a React Router link
LinkButton = withRouter(function(props) {
  var history, location, match, onClick, rest, staticContext, to;
  ({to, history, staticContext, onClick, match, location, ...rest} = props);
  onClick = function(event) {
    if (to == null) {
      return;
    }
    history.push(to);
    return event.preventDefault();
  };
  return h(AnchorButton, {onClick, ...rest});
});

NavLinkButton = function(props) {
  var className, rest;
  ({className, ...rest} = props);
  className = classNames(className, "bp3-button bp3-minimal");
  return h(NavLink, {className, ...rest});
};

var CancelButton, EditButton, SaveButton;

SaveButton = function(props) {
  var className, disabled, icon, inProgress, rest;
  ({className, inProgress, disabled, ...rest} = props);
  className = classNames(className, 'save-button');
  icon = 'floppy-disk';
  if (inProgress) {
    icon = h(Spinner, {
      size: 20
    });
    disabled = true;
  }
  return h(Button, {
    icon,
    intent: Intent.SUCCESS,
    className,
    disabled,
    ...rest
  });
};

CancelButton = function(props) {
  var className, rest;
  ({className, ...rest} = props);
  className = classNames(className, 'cancel-button');
  return h(Button, {
    intent: Intent.WARNING,
    className,
    ...rest
  });
};

EditButton = function(props) {
  var className, icon, intent, isEditing, rest;
  ({isEditing, intent, icon, className, ...rest} = props);
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
  return h(Button, {icon, intent, className, ...rest});
};

// This component should be refactored into a shared UI component
var CollapsePanel, HeaderButton;

HeaderButton = styled(Button)`.bp3-button-text {\n  flex-grow: 1;\n  display: flex;\n}\n.bp3-button-text * {\n  display: inline;\n}\nspan.expander {\n  flex-grow: 1;\n}`;

CollapsePanel = (function() {
  class CollapsePanel extends Component {
    constructor(props) {
      super(props);
      this.state = {
        isOpen: false
      };
    }

    componentWillMount() {
      var isOpen, storageID;
      // Set open state from local storage if it is available
      ({storageID} = this.props);
      if (storageID == null) {
        return;
      }
      isOpen = this.savedState()[storageID];
      if (isOpen == null) {
        return;
      }
      return this.setState({isOpen});
    }

    /*
    Next functions are for state management
    across pages, if storageID prop is passed
    */
    savedState() {
      var st;
      try {
        st = window.localStorage.getItem('collapse-panel-state');
        return JSON.parse(st) || {};
      } catch (error) {
        return {};
      }
    }

    checkLocalStorage() {
      var isOpen, storageID;
      // Set open state from local storage if it is available
      ({storageID} = this.props);
      if (storageID == null) {
        return;
      }
      isOpen = this.savedState()[storageID] || null;
      if (isOpen == null) {
        isOpen = false;
      }
      return this.setState({isOpen});
    }

    componentDidUpdate(prevProps, prevState) {
      var isOpen, j, s, storageID;
      // Refresh object in local storage
      ({storageID} = this.props);
      if (storageID == null) {
        return;
      }
      ({isOpen} = this.state);
      if (isOpen === prevState.isOpen) {
        return;
      }
      s = this.savedState();
      s[storageID] = isOpen;
      j = JSON.stringify(s);
      return window.localStorage.setItem('collapse-panel-state', j);
    }

    render() {
      var children, headerRight, icon, isOpen, onClick, props, storageID, title;
      ({title, children, storageID, headerRight, ...props} = this.props);
      ({isOpen} = this.state);
      icon = isOpen ? 'collapse-all' : 'expand-all';
      onClick = () => {
        return this.setState({
          isOpen: !isOpen
        });
      };
      if (headerRight == null) {
        headerRight = null;
      }
      return h('div.collapse-panel', props, [
        h('div.panel-header',
        [
          h(HeaderButton,
          {
            icon,
            minimal: true,
            onClick,
            fill: true
          },
          [h('h2',
          title),
          h('span.expander')]),
          headerRight
        ]),
        h(Collapse,
        {isOpen},
        children)
      ]);
    }

  }
  CollapsePanel.defaultProps = {
    title: "Panel",
    // `storageID` prop allows storage of state in
    // localStorage or equivalent.
    storageID: null
  };

  return CollapsePanel;

}).call(undefined);

var LinkCard;

LinkCard = function(props) {
  var className, href, inner, rest, target, to;
  ({to, href, target, ...rest} = props);
  className = "link-card";
  inner = h(Card, {...rest});
  if (to == null) {
    return h('a', {href, target, className}, inner);
  }
  return h(Link, {to, className}, inner);
};

var FileList, FileListItem, FileUploadComponent,
  boundMethodCheck$2 = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

FileListItem = function(props) {
  var file;
  ({file} = props);
  return h(Tag, {
    icon: 'document'
  }, file.name);
};

FileList = function(props) {
  var files, placeholder;
  ({files, placeholder} = props);
  if (placeholder == null) {
    placeholder = "Choose file...";
  }
  if (!((files != null) && files.length > 0)) {
    return placeholder;
  }
  return h('div.files', files.map(function(file) {
    return h(FileListItem, {file});
  }));
};

FileUploadComponent = (function() {
  class FileUploadComponent extends Component {
    constructor() {
      super(...arguments);
      this.renderDropzone = this.renderDropzone.bind(this);
    }

    renderDropzone({getRootProps, getInputProps, isDragActive}) {
      var className, files, inputProps, msg, rootProps;
      boundMethodCheck$2(this, FileUploadComponent);
      ({files} = this.props);
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
      return h('div', {className, ...rootProps}, [
        h('label.bp3-file-input.bp3-large',
        [
          h('input',
          inputProps),
          h('div.bp3-file-upload-input',
          [
            h(FileList,
            {
              files,
              placeholder: msg
            })
          ])
        ])
      ]);
    }

    render() {
      return h(Dropzone, {
        onDrop: this.props.onAddFile,
        onFileDialogCancel: this.props.onCancel
      }, this.renderDropzone);
    }

  }
  /*
  An elaboration of the file upload component
  from BlueprintJS with file drop zone capability
  */
  FileUploadComponent.defaultProps = {
    onAddFile: function() {},
    onCancel: function() {}
  };

  return FileUploadComponent;

}).call(undefined);

var ConfinedImage;

ConfinedImage = class ConfinedImage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageSize: null
    };
  }

  render() {
    var imageSize, imgStyle, maxHeight, maxWidth, src, style;
    ({maxHeight, maxWidth, src} = this.props);
    ({imageSize} = this.state);
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
    imgStyle = {maxHeight, maxWidth};
    style = {maxHeight, maxWidth};
    return h('div.image-container', {style}, [
      h('img',
      {
        src,
        style: imgStyle
      })
    ]);
  }

  componentDidMount() {
    var el, img;
    el = findDOMNode(this);
    img = el.querySelector('img');
    return img.onload = () => {
      var height, width;
      height = img.naturalHeight / 2;
      width = img.naturalWidth / 2;
      return this.setState({
        imageSize: {height, width}
      });
    };
  }

};

var StatefulComponent,
  boundMethodCheck$3 = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

StatefulComponent = class StatefulComponent extends Component {
  constructor() {
    super(...arguments);
    this.updateState = this.updateState.bind(this);
  }

  updateState(spec) {
    var newState;
    boundMethodCheck$3(this, StatefulComponent);
    newState = update(this.state, spec);
    return this.setState(newState);
  }

};

var EditableDateField, EditableField, ModelEditButton, ModelEditor, ModelEditorContext,
  boundMethodCheck$4 = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

ModelEditorContext = createContext({});

ModelEditButton = (function() {
  class ModelEditButton extends Component {
    render() {
      var actions, isEditing;
      ({isEditing, actions} = this.context);
      return h(EditButton, {
        isEditing,
        onClick: actions.toggleEditing,
        ...this.props
      });
    }

  }
  ModelEditButton.contextType = ModelEditorContext;

  return ModelEditButton;

}).call(undefined);

ModelEditor = (function() {
  class ModelEditor extends StatefulComponent {
    constructor(props) {
      super(props);
      this.getValue = this.getValue.bind(this);
      this.hasChanges = this.hasChanges.bind(this);
      this.onChange = this.onChange.bind(this);
      this.toggleEditing = this.toggleEditing.bind(this);
      this.state = {
        isEditing: false,
        error: null,
        data: props.data,
        initialData: props.data
      };
    }

    render() {
      var actions, data, isEditing, value;
      ({data, isEditing} = this.state);
      actions = (() => {
        var onChange, toggleEditing, updateState;
        return ({onChange, toggleEditing, updateState} = this);
      })();
      value = {
        actions,
        data,
        isEditing,
        hasChanges: this.hasChanges
      };
      console.log(value);
      return h(ModelEditorContext.Provider, {value}, this.props.children);
    }

    getValue(field) {
      boundMethodCheck$4(this, ModelEditor);
      return this.state.data[field];
    }

    hasChanges() {
      boundMethodCheck$4(this, ModelEditor);
      return this.props.data !== this.state.data;
    }

    onChange(field) {
      boundMethodCheck$4(this, ModelEditor);
      return (value) => {
        var data;
        data = {};
        data[field] = {
          $set: value
        };
        return this.updateState({data});
      };
    }

    toggleEditing() {
      boundMethodCheck$4(this, ModelEditor);
      return this.updateState({
        $toggle: ['isEditing']
      });
    }

    componentDidUpdate(prevProps) {
      if (this.props.data !== prevProps.data) {
        return this.updateState({
          initialData: {
            $set: this.props.data
          }
        });
      }
    }

  }
  ModelEditor.EditButton = ModelEditButton;

  return ModelEditor;

}).call(undefined);

EditableField = (function() {
  class EditableField extends Component {
    render() {
      var actions, className, data, field, isEditing, onChange, value;
      ({field, className} = this.props);
      ({actions, data, isEditing} = this.context);
      value = data[field];
      onChange = actions.onChange(field);
      className = classNames(className, `field-${field}`);
      if (isEditing) {
        value = h(EditableText, {
          placeholder: `Edit ${field}`,
          multiline: true,
          className,
          onChange,
          value
        });
      }
      return h('div.text', {className}, value);
    }

  }
  EditableField.contextType = ModelEditorContext;

  return EditableField;

}).call(undefined);

EditableDateField = (function() {
  class EditableDateField extends Component {
    render() {
      var actions, data, field, isEditing, value;
      ({field} = this.props);
      ({actions, data, isEditing} = this.context);
      value = data[field];
      if (!isEditing) {
        return h('div.date-input.disabled', value);
      }
      return h(DateInput, {
        className: 'date-input',
        value: new Date(value),
        formatDate: (date) => {
          return date.toLocaleDateString();
        },
        placeholder: "MM/DD/YYYY",
        showActionsBar: true,
        onChange: actions.onChange(field),
        parseDate: function(d) {
          return new Date(d);
        }
      });
    }

  }
  EditableDateField.contextType = ModelEditorContext;

  return EditableDateField;

}).call(undefined);

var AuthorList, GDDReferenceCard, GeoDeepDiveSwatchInner, VolumeNumber;

AuthorList = function(props) {
  var _, author, authors, etAl, i, isLast, ix, len, name, newName;
  ({authors} = props);
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
    isLast = ix === authors.length - 1 && (etAl == null);
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

VolumeNumber = function(props) {
  var _, number, volume;
  ({volume, number} = props);
  _ = [];
  if ((volume != null) && volume !== "") {
    _.push(h('span.volume', null, volume));
  }
  if ((number != null) && number !== "") {
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

GeoDeepDiveSwatchInner = class GeoDeepDiveSwatchInner extends Component {
  render() {
    var author, doi, identifier, journal, link, number, title, url, volume, year;
    ({title, author, doi, link, journal, identifier, volume, number, year} = this.props);
    try {
      ({url} = link.find(function(d) {
        return d.type === 'publisher';
      }));
    } catch (error) {
      url = null;
    }
    try {
      ({
        id: doi
      } = identifier.find(function(d) {
        return d.type === 'doi';
      }));
    } catch (error) {
      doi = null;
    }
    return h(LinkCard, {
      href: url,
      target: '_blank',
      interactive: true,
      className: 'gdd-article'
    }, [
      h(AuthorList,
      {
        authors: author
      }),
      ", ",
      h('span.title',
      title),
      ", ",
      h('span.journal',
      journal),
      ", ",
      h(VolumeNumber,
      {volume,
      number}),
      h('span.year',
      year),
      ", ",
      h('span.doi-title',
      'doi: '),
      h('span.doi',
      doi)
    ]);
  }

};

GDDReferenceCard = class GDDReferenceCard extends Component {
  render() {
    var docid;
    ({docid} = this.props);
    return h(APIResultView, {
      route: "http://geodeepdive.org/api/articles",
      params: {docid},
      opts: {
        unwrapResponse: function(res) {
          return res.success.data[0];
        },
        memoize: true,
        onError: console.error
      }
    }, (data) => {
      try {
        return h(GeoDeepDiveSwatchInner, data);
      } catch (error) {
        return null;
      }
    });
  }

};

var HTML, Markdown;

Markdown = function({src, ...rest}) {
  return h('div', {
    dangerouslySetInnerHTML: {
      __html: src,
      ...rest
    }
  });
};

HTML = Markdown;

export { APIConsumer, APIContext, APIProvider, APIResultView, APIViewConsumer, APIViewContext, AppToaster, CancelButton, CollapsePanel, ConfinedImage, DeleteButton, EditButton, EditableDateField, EditableField, FileUploadComponent, GDDReferenceCard, HTML, LinkButton, LinkCard, Markdown, ModelEditor, ModelEditorContext, NavLinkButton, PagedAPIView, SaveButton, StatefulComponent, buildQueryString };

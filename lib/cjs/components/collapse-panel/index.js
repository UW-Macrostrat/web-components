'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');
var styled = _interopDefault(require('@emotion/styled'));

function _templateObject() {
  var data = __chunk_1.taggedTemplateLiteral([".bp3-button-text {\n  flex-grow: 1;\n  display: flex;\n}\n.bp3-button-text * {\n  display: inline;\n}\nspan.expander {\n  flex-grow: 1;\n}"], [".bp3-button-text {\\n  flex-grow: 1;\\n  display: flex;\\n}\\n.bp3-button-text * {\\n  display: inline;\\n}\\nspan.expander {\\n  flex-grow: 1;\\n}"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

// This component should be refactored into a shared UI component
var HeaderButton;
HeaderButton = styled(core.Button)(_templateObject());

exports.CollapsePanel = function () {
  var CollapsePanel =
  /*#__PURE__*/
  function (_Component) {
    __chunk_1.inherits(CollapsePanel, _Component);

    function CollapsePanel(props) {
      var _this;

      __chunk_1.classCallCheck(this, CollapsePanel);

      _this = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(CollapsePanel).call(this, props));
      _this.state = {
        isOpen: false
      };
      return _this;
    }

    __chunk_1.createClass(CollapsePanel, [{
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
        props = __chunk_1.objectWithoutProperties(_this$props, ["title", "children", "storageID", "headerRight"]);
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
        }, [h('h2', title), h('span.expander')]), headerRight]), h(core.Collapse, {
          isOpen: isOpen
        }, children)]);
      }
    }]);

    return CollapsePanel;
  }(react.Component);
  CollapsePanel.defaultProps = {
    title: "Panel",
    // `storageID` prop allows storage of state in
    // localStorage or equivalent.
    storageID: null
  };
  return CollapsePanel;
}.call(undefined);
//# sourceMappingURL=index.js.map

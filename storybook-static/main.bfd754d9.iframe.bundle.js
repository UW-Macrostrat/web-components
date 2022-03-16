(window.webpackJsonp = window.webpackJsonp || []).push([
  [3],
  {
    "./.storybook/preview.js-generated-config-entry.js": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__);
      var preview_namespaceObject = {};
      __webpack_require__.r(preview_namespaceObject),
        __webpack_require__.d(
          preview_namespaceObject,
          "parameters",
          function () {
            return parameters;
          }
        );
      __webpack_require__("./node_modules/core-js/modules/es.object.keys.js"),
        __webpack_require__("./node_modules/core-js/modules/es.symbol.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.filter.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.object.get-own-property-descriptor.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.for-each.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/web.dom-collections.for-each.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.object.get-own-property-descriptors.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.object.define-properties.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.object.define-property.js"
        );
      var ClientApi = __webpack_require__(
          "./node_modules/@storybook/client-api/dist/esm/ClientApi.js"
        ),
        esm = __webpack_require__(
          "./node_modules/@storybook/client-logger/dist/esm/index.js"
        ),
        parameters = {
          actions: { argTypesRegex: "^on[A-Z].*" },
          controls: {
            matchers: { color: /(background|color)$/i, date: /Date$/ },
          },
        };
      function ownKeys(object, enumerableOnly) {
        var keys = Object.keys(object);
        if (Object.getOwnPropertySymbols) {
          var symbols = Object.getOwnPropertySymbols(object);
          enumerableOnly &&
            (symbols = symbols.filter(function (sym) {
              return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            })),
            keys.push.apply(keys, symbols);
        }
        return keys;
      }
      function _defineProperty(obj, key, value) {
        return (
          key in obj
            ? Object.defineProperty(obj, key, {
                value: value,
                enumerable: !0,
                configurable: !0,
                writable: !0,
              })
            : (obj[key] = value),
          obj
        );
      }
      Object.keys(preview_namespaceObject).forEach(function (key) {
        var value = preview_namespaceObject[key];
        switch (key) {
          case "args":
          case "argTypes":
            return esm.a.warn(
              "Invalid args/argTypes in config, ignoring.",
              JSON.stringify(value)
            );
          case "decorators":
            return value.forEach(function (decorator) {
              return Object(ClientApi.d)(decorator, !1);
            });
          case "loaders":
            return value.forEach(function (loader) {
              return Object(ClientApi.e)(loader, !1);
            });
          case "parameters":
            return Object(ClientApi.f)(
              (function _objectSpread(target) {
                for (var i = 1; i < arguments.length; i++) {
                  var source = null != arguments[i] ? arguments[i] : {};
                  i % 2
                    ? ownKeys(Object(source), !0).forEach(function (key) {
                        _defineProperty(target, key, source[key]);
                      })
                    : Object.getOwnPropertyDescriptors
                    ? Object.defineProperties(
                        target,
                        Object.getOwnPropertyDescriptors(source)
                      )
                    : ownKeys(Object(source)).forEach(function (key) {
                        Object.defineProperty(
                          target,
                          key,
                          Object.getOwnPropertyDescriptor(source, key)
                        );
                      });
                }
                return target;
              })({}, value),
              !1
            );
          case "argTypesEnhancers":
            return value.forEach(function (enhancer) {
              return Object(ClientApi.b)(enhancer);
            });
          case "argsEnhancers":
            return value.forEach(function (enhancer) {
              return Object(ClientApi.c)(enhancer);
            });
          case "render":
            return Object(ClientApi.g)(value);
          case "globals":
          case "globalTypes":
            var v = {};
            return (v[key] = value), Object(ClientApi.f)(v, !1);
          case "__namedExportsOrder":
          case "decorateStory":
          case "renderToDOM":
            return null;
          default:
            return console.log(key + " was not supported :( !");
        }
      });
    },
    "./generated-stories-entry.js": function (
      module,
      exports,
      __webpack_require__
    ) {
      "use strict";
      (function (module) {
        (0,
        __webpack_require__(
          "./node_modules/@storybook/react/dist/esm/client/index.js"
        ).configure)(
          [
            __webpack_require__(
              "./src sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.mdx)$"
            ),
            __webpack_require__(
              "./src sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.(js|jsx|ts|tsx))$"
            ),
          ],
          module,
          !1
        );
      }.call(
        this,
        __webpack_require__("./node_modules/webpack/buildin/module.js")(module)
      ));
    },
    "./node_modules/css-loader/dist/cjs.js!./node_modules/stylus-loader/dist/cjs.js?!./src/concepts/taxa.module.styl":
      function (module, exports, __webpack_require__) {
        (exports = __webpack_require__(
          "./node_modules/css-loader/dist/runtime/api.js"
        )(!1)).push([
          module.i,
          ".prevalent-taxa-row{background-color:#999;padding:15px;margin-top:20px;height:90px}.prevalent-taxa-container{text-align:center;display:table;height:100%}.prevalent-taxa-container:first-of-type{border-right:1px solid #f5f5f5}.prevalent-taxa{display:table-cell;vertical-align:middle}.prevalent-taxa > img{filter:invert(1);-webkit-filter:invert(1);-ms-filter:'progid:DXImageTransform.Microsoft.BasicImage(invert=1)';height:35px}.prevalent-taxa > p{color:#f5f5f5;font-size:.8em;font-weight:200;margin-top:5px}#prevalent-taxa-title{color:#f5f5f5;font-size:1.2em;margin-bottom:0}.normalize-link{color:inherit}.normalize-link:hover{color:inherit}",
          "",
        ]),
          (module.exports = exports);
      },
    "./node_modules/css-loader/dist/cjs.js!./node_modules/stylus-loader/dist/cjs.js?!./src/hierarchy/hierarchy.module.styl":
      function (module, exports, __webpack_require__) {
        (exports = __webpack_require__(
          "./node_modules/css-loader/dist/runtime/api.js"
        )(!1)).push([
          module.i,
          ".name-hierarchy{width:92%;padding-top:35px;max-width:700px;margin:0 auto}.hierarchy-container{border:1px solid #eee;cursor:pointer;background-color:#fff}.active{background-color:rgba(153,0,0,0.3) !important;border:2px solid rgba(153,0,0,0.3) !important}.hierarchy-name{font-weight:bold;padding:7px}.hierarchy-link{text-decoration:none;color:#000}.hierarchy-link:hover{color:#900;text-decoration:none}.hierarchy-children{margin-left:7px;padding-left:7px}.hierarchy-children .hierarchy-container{border-bottom:0 !important;border-right:0 !important}.hierarchy-children .active{border:2px solid rgba(153,0,0,0.3) !important}.badge{background-color:#aaa;color:#fff;padding:3px;border-radius:10px;font-weight:200;display:inline-block;margin-left:3px;min-width:10px;padding:3px 7px;font-size:12px;color:#fff;vertical-align:middle;border-radius:10px}",
          "",
        ]),
          (module.exports = exports);
      },
    "./node_modules/css-loader/dist/cjs.js!./node_modules/stylus-loader/dist/cjs.js?!./src/modal-panel/main.module.styl":
      function (module, exports, __webpack_require__) {
        (exports = __webpack_require__(
          "./node_modules/css-loader/dist/runtime/api.js"
        )(!1)).push([
          module.i,
          ".panel-header{background-color:#eee;display:flex;flex-direction:row;justify-content:space-between;align-items:baseline;padding:.2em .6em;border-bottom:1px solid #ddd}.panel-header h1{margin-bottom:.2em;margin-top:.2em;font-size:1.2em}.panel-header :global(.bp3-button){align-self:center}.expander{flex-grow:1}.panel-column{flex-grow:1;position:relative}.panel,.content-panel{overflow:hidden;box-shadow:0 0 0 1px rgba(16,22,26,0.2),0 0 0 rgba(16,22,26,0),0 1px 1px rgba(16,22,26,0.4);border-radius:6px;background-color:#fff;display:flex;flex-direction:column}.content-panel{padding:.5em}.panel{flex-shrink:1;height:100%}.panel.minimal{box-shadow:none;border-radius:0;border:1px solid #ddd}.panel.minimal .panel-content{padding:0}.panel-content{overflow-y:scroll;padding:1em;flex:1}.panel-content>:last-child{margin-bottom:1em}.panel-outer{display:flex;flex-direction:column;position:relative;max-height:100%}.panel-container-inner{position:absolute;top:2em;bottom:2em;left:1em;right:1em;display:flex;flex-direction:column}.panel-container-inner .expander{flex:1}.extra-space{width:1em}.panel-container{position:sticky;height:100vh;top:0;display:flex;flex-direction:column}",
          "",
        ]),
          (module.exports = exports);
      },
    "./node_modules/css-loader/dist/cjs.js!./node_modules/stylus-loader/dist/cjs.js?!./src/panel-stack/panel.styl":
      function (module, exports, __webpack_require__) {
        var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(
            "./node_modules/css-loader/dist/runtime/api.js"
          ),
          ___CSS_LOADER_AT_RULE_IMPORT_0___ = __webpack_require__(
            "./node_modules/css-loader/dist/cjs.js!./node_modules/normalize.css/normalize.css"
          ),
          ___CSS_LOADER_AT_RULE_IMPORT_1___ = __webpack_require__(
            "./node_modules/css-loader/dist/cjs.js!./node_modules/@blueprintjs/core/lib/css/blueprint.css"
          ),
          ___CSS_LOADER_AT_RULE_IMPORT_2___ = __webpack_require__(
            "./node_modules/css-loader/dist/cjs.js!./node_modules/@blueprintjs/icons/lib/css/blueprint-icons.css"
          );
        (exports = ___CSS_LOADER_API_IMPORT___(!1)).i(
          ___CSS_LOADER_AT_RULE_IMPORT_0___
        ),
          exports.i(___CSS_LOADER_AT_RULE_IMPORT_1___),
          exports.i(___CSS_LOADER_AT_RULE_IMPORT_2___),
          exports.push([
            module.i,
            ".stack{height:70vh;width:100%}.panel-content{display:flex;justify-content:center;flex-direction:column;align-items:center}",
            "",
          ]),
          (module.exports = exports);
      },
    "./node_modules/css-loader/dist/cjs.js?!./node_modules/postcss-loader/dist/cjs.js?!./src/stories/header.css":
      function (module, exports, __webpack_require__) {
        var ___CSS_LOADER_API_IMPORT___ = __webpack_require__(
            "./node_modules/css-loader/dist/runtime/api.js"
          ),
          ___CSS_LOADER_AT_RULE_IMPORT_0___ = __webpack_require__(
            "./node_modules/css-loader/dist/cjs.js?!./node_modules/postcss-loader/dist/cjs.js?!./node_modules/normalize.css/normalize.css"
          ),
          ___CSS_LOADER_AT_RULE_IMPORT_1___ = __webpack_require__(
            "./node_modules/css-loader/dist/cjs.js?!./node_modules/postcss-loader/dist/cjs.js?!./node_modules/@blueprintjs/core/lib/css/blueprint.css"
          ),
          ___CSS_LOADER_AT_RULE_IMPORT_2___ = __webpack_require__(
            "./node_modules/css-loader/dist/cjs.js?!./node_modules/postcss-loader/dist/cjs.js?!./node_modules/@blueprintjs/icons/lib/css/blueprint-icons.css"
          );
        (exports = ___CSS_LOADER_API_IMPORT___(!1)).i(
          ___CSS_LOADER_AT_RULE_IMPORT_0___
        ),
          exports.i(___CSS_LOADER_AT_RULE_IMPORT_1___),
          exports.i(___CSS_LOADER_AT_RULE_IMPORT_2___),
          exports.push([
            module.i,
            '.wrapper {\n  font-family: "Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n  border-bottom: 1px solid rgba(0, 0, 0, 0.1);\n  padding: 15px 20px;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\nsvg {\n  display: inline-block;\n  vertical-align: top;\n}\n\nh1 {\n  font-weight: 900;\n  font-size: 20px;\n  line-height: 1;\n  margin: 6px 0 6px 10px;\n  display: inline-block;\n  vertical-align: top;\n}\n\nbutton + button {\n  margin-left: 10px;\n}\n',
            "",
          ]),
          (module.exports = exports);
      },
    "./node_modules/css-loader/dist/cjs.js?!./node_modules/postcss-loader/dist/cjs.js?!./src/stories/page.css":
      function (module, exports, __webpack_require__) {
        (exports = __webpack_require__(
          "./node_modules/css-loader/dist/runtime/api.js"
        )(!1)).push([
          module.i,
          'section {\n  font-family: "Nunito Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n  font-size: 14px;\n  line-height: 24px;\n  padding: 48px 20px;\n  margin: 0 auto;\n  max-width: 600px;\n  color: #333;\n}\n\nh2 {\n  font-weight: 900;\n  font-size: 32px;\n  line-height: 1;\n  margin: 0 0 4px;\n  display: inline-block;\n  vertical-align: top;\n}\n\np {\n  margin: 1em 0;\n}\n\na {\n  text-decoration: none;\n  color: #1ea7fd;\n}\n\nul {\n  padding-left: 30px;\n  margin: 1em 0;\n}\n\nli {\n  margin-bottom: 8px;\n}\n\n.tip {\n  display: inline-block;\n  border-radius: 1em;\n  font-size: 11px;\n  line-height: 12px;\n  font-weight: 700;\n  background: #e7fdd8;\n  color: #66bf3c;\n  padding: 4px 12px;\n  margin-right: 10px;\n  vertical-align: top;\n}\n\n.tip-wrapper {\n  font-size: 13px;\n  line-height: 20px;\n  margin-top: 40px;\n  margin-bottom: 40px;\n}\n\n.tip-wrapper svg {\n  display: inline-block;\n  height: 12px;\n  width: 12px;\n  margin-right: 4px;\n  vertical-align: top;\n  margin-top: 3px;\n}\n\n.tip-wrapper svg path {\n  fill: #1ea7fd;\n}\n',
          "",
        ]),
          (module.exports = exports);
      },
    "./src sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.(js|jsx|ts|tsx))$":
      function (module, exports, __webpack_require__) {
        var map = {
          "./buttons/Button.stories.tsx": "./src/buttons/Button.stories.tsx",
          "./citations/AuthorList.stories.tsx":
            "./src/citations/AuthorList.stories.tsx",
          "./concepts/concepts.stories.ts":
            "./src/concepts/concepts.stories.ts",
          "./hierarchy/hierarchy.stories.ts":
            "./src/hierarchy/hierarchy.stories.ts",
          "./modal-panel/ModalPanel.stories.ts":
            "./src/modal-panel/ModalPanel.stories.ts",
          "./panel-stack/PanelStack.stories.ts":
            "./src/panel-stack/PanelStack.stories.ts",
          "./stories/Header.stories.tsx": "./src/stories/Header.stories.tsx",
          "./stories/Page.stories.tsx": "./src/stories/Page.stories.tsx",
        };
        function webpackContext(req) {
          var id = webpackContextResolve(req);
          return __webpack_require__(id);
        }
        function webpackContextResolve(req) {
          if (!__webpack_require__.o(map, req)) {
            var e = new Error("Cannot find module '" + req + "'");
            throw ((e.code = "MODULE_NOT_FOUND"), e);
          }
          return map[req];
        }
        (webpackContext.keys = function webpackContextKeys() {
          return Object.keys(map);
        }),
          (webpackContext.resolve = webpackContextResolve),
          (module.exports = webpackContext),
          (webpackContext.id =
            "./src sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.(js|jsx|ts|tsx))$");
      },
    "./src sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.mdx)$":
      function (module, exports, __webpack_require__) {
        var map = {
          "./stories/Introduction.stories.mdx":
            "./src/stories/Introduction.stories.mdx",
        };
        function webpackContext(req) {
          var id = webpackContextResolve(req);
          return __webpack_require__(id);
        }
        function webpackContextResolve(req) {
          if (!__webpack_require__.o(map, req)) {
            var e = new Error("Cannot find module '" + req + "'");
            throw ((e.code = "MODULE_NOT_FOUND"), e);
          }
          return map[req];
        }
        (webpackContext.keys = function webpackContextKeys() {
          return Object.keys(map);
        }),
          (webpackContext.resolve = webpackContextResolve),
          (module.exports = webpackContext),
          (webpackContext.id =
            "./src sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.mdx)$");
      },
    "./src/buttons/Button.stories.tsx": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(__webpack_exports__, "Primary", function () {
          return Primary;
        }),
        __webpack_require__.d(__webpack_exports__, "InProgress", function () {
          return InProgress;
        });
      __webpack_require__("./node_modules/core-js/modules/es.object.assign.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.bind.js"
        ),
        __webpack_require__("../../../node_modules/react/index.js"),
        __webpack_require__("./node_modules/core-js/modules/es.object.keys.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.index-of.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.symbol.js");
      var index_module = __webpack_require__(
          "./node_modules/@macrostrat/hyper/dist/index.module.js"
        ),
        components = __webpack_require__(
          "./node_modules/@blueprintjs/core/lib/esm/components/index.js"
        ),
        common_intent = __webpack_require__(
          "./node_modules/@blueprintjs/core/lib/esm/common/intent.js"
        ),
        classnames = __webpack_require__("./node_modules/classnames/index.js"),
        classnames_default = __webpack_require__.n(classnames);
      __webpack_require__(
        "./node_modules/core-js/modules/es.array.is-array.js"
      ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.symbol.description.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.object.to-string.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.symbol.iterator.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.string.iterator.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.iterator.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/web.dom-collections.iterator.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.array.slice.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.name.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.array.from.js");
      var buttons_excluded = ["className", "inProgress", "disabled"];
      function buttons_objectWithoutProperties(source, excluded) {
        if (null == source) return {};
        var key,
          i,
          target = (function buttons_objectWithoutPropertiesLoose(
            source,
            excluded
          ) {
            if (null == source) return {};
            var key,
              i,
              target = {},
              sourceKeys = Object.keys(source);
            for (i = 0; i < sourceKeys.length; i++)
              (key = sourceKeys[i]),
                excluded.indexOf(key) >= 0 || (target[key] = source[key]);
            return target;
          })(source, excluded);
        if (Object.getOwnPropertySymbols) {
          var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
          for (i = 0; i < sourceSymbolKeys.length; i++)
            (key = sourceSymbolKeys[i]),
              excluded.indexOf(key) >= 0 ||
                (Object.prototype.propertyIsEnumerable.call(source, key) &&
                  (target[key] = source[key]));
        }
        return target;
      }
      var buttons_SaveButton = function SaveButton(props) {
          var className = props.className,
            inProgress = props.inProgress,
            disabled = props.disabled,
            rest = buttons_objectWithoutProperties(props, buttons_excluded);
          className = classnames_default()(className, "save-button");
          var icon = "floppy-disk";
          return (
            inProgress &&
              ((icon = Object(index_module.a)(components.e, { size: 20 })),
              (disabled = !0)),
            Object(index_module.a)(
              components.b,
              Object.assign(
                {
                  icon: icon,
                  intent: common_intent.a.SUCCESS,
                  className: className,
                  disabled: disabled,
                },
                rest
              )
            )
          );
        },
        jsx_runtime = __webpack_require__(
          "../../../node_modules/react/jsx-runtime.js"
        ),
        Button_stories_Template =
          ((__webpack_exports__.default = {
            title: "Example/SaveButton",
            component: buttons_SaveButton,
            argTypes: {},
          }),
          function Template(args) {
            return Object(jsx_runtime.jsx)(
              buttons_SaveButton,
              Object.assign({}, args)
            );
          });
      Button_stories_Template.displayName = "Template";
      var Primary = Button_stories_Template.bind({});
      Primary.args = {};
      var InProgress = Button_stories_Template.bind({});
      (InProgress.args = { inProgress: !0 }),
        (Primary.parameters = Object.assign(
          {
            storySource: {
              source: "(args) => (\n  <SaveButton {...args} />\n)",
            },
          },
          Primary.parameters
        )),
        (InProgress.parameters = Object.assign(
          {
            storySource: {
              source: "(args) => (\n  <SaveButton {...args} />\n)",
            },
          },
          InProgress.parameters
        ));
    },
    "./src/citations/AuthorList.stories.tsx": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(__webpack_exports__, "NameList", function () {
          return NameList;
        }),
        __webpack_require__.d(__webpack_exports__, "WithHighligh", function () {
          return WithHighligh;
        });
      __webpack_require__("./node_modules/core-js/modules/es.object.assign.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.bind.js"
        );
      var index_module = __webpack_require__(
        "./node_modules/@macrostrat/hyper/dist/index.module.js"
      );
      __webpack_require__("./node_modules/core-js/modules/es.function.name.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.is-array.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.object.to-string.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.iterator.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/web.dom-collections.iterator.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.symbol.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.symbol.description.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.symbol.iterator.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.string.iterator.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.array.slice.js"),
        __webpack_require__("./node_modules/core-js/modules/es.array.from.js");
      function _slicedToArray(arr, i) {
        return (
          (function _arrayWithHoles(arr) {
            if (Array.isArray(arr)) return arr;
          })(arr) ||
          (function _iterableToArrayLimit(arr, i) {
            var _i =
              null == arr
                ? null
                : ("undefined" != typeof Symbol && arr[Symbol.iterator]) ||
                  arr["@@iterator"];
            if (null == _i) return;
            var _s,
              _e,
              _arr = [],
              _n = !0,
              _d = !1;
            try {
              for (
                _i = _i.call(arr);
                !(_n = (_s = _i.next()).done) &&
                (_arr.push(_s.value), !i || _arr.length !== i);
                _n = !0
              );
            } catch (err) {
              (_d = !0), (_e = err);
            } finally {
              try {
                _n || null == _i.return || _i.return();
              } finally {
                if (_d) throw _e;
              }
            }
            return _arr;
          })(arr, i) ||
          _unsupportedIterableToArray(arr, i) ||
          (function _nonIterableRest() {
            throw new TypeError(
              "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
            );
          })()
        );
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (o) {
          if ("string" == typeof o) return _arrayLikeToArray(o, minLen);
          var n = Object.prototype.toString.call(o).slice(8, -1);
          return (
            "Object" === n && o.constructor && (n = o.constructor.name),
            "Map" === n || "Set" === n
              ? Array.from(o)
              : "Arguments" === n ||
                /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
              ? _arrayLikeToArray(o, minLen)
              : void 0
          );
        }
      }
      function _arrayLikeToArray(arr, len) {
        (null == len || len > arr.length) && (len = arr.length);
        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
        return arr2;
      }
      var author_list_Author = function Author(props) {
          var name = props.name;
          return name === props.highlight
            ? Object(index_module.a)("b.author", name)
            : Object(index_module.a)("span.author", name);
        },
        author_list_AuthorList = function AuthorList(props) {
          var _props$limit,
            names = props.names,
            highlight = props.highlight,
            A = function A(name) {
              return Object(index_module.a)(author_list_Author, {
                name: name,
                highlight: highlight,
              });
            };
          if (!Array.isArray(names)) return A(names);
          var n = names.length;
          if (0 === n) return null;
          if (1 === n) return A(names[0]);
          var _step,
            limit =
              null !== (_props$limit = props.limit) && void 0 !== _props$limit
                ? _props$limit
                : n,
            truncated = n > limit,
            penultimateIx = limit - 1,
            L = [],
            _iterator = (function _createForOfIteratorHelper(
              o,
              allowArrayLike
            ) {
              var it =
                ("undefined" != typeof Symbol && o[Symbol.iterator]) ||
                o["@@iterator"];
              if (!it) {
                if (
                  Array.isArray(o) ||
                  (it = _unsupportedIterableToArray(o)) ||
                  (allowArrayLike && o && "number" == typeof o.length)
                ) {
                  it && (o = it);
                  var i = 0,
                    F = function F() {};
                  return {
                    s: F,
                    n: function n() {
                      return i >= o.length
                        ? { done: !0 }
                        : { done: !1, value: o[i++] };
                    },
                    e: function e(_e2) {
                      throw _e2;
                    },
                    f: F,
                  };
                }
                throw new TypeError(
                  "Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
                );
              }
              var err,
                normalCompletion = !0,
                didErr = !1;
              return {
                s: function s() {
                  it = it.call(o);
                },
                n: function n() {
                  var step = it.next();
                  return (normalCompletion = step.done), step;
                },
                e: function e(_e3) {
                  (didErr = !0), (err = _e3);
                },
                f: function f() {
                  try {
                    normalCompletion || null == it.return || it.return();
                  } finally {
                    if (didErr) throw err;
                  }
                },
              };
            })(names.entries());
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done; ) {
              var _ref2 = _slicedToArray(_step.value, 2),
                i = _ref2[0],
                name = _ref2[1];
              if (
                (L.push(A(name)),
                L.push(i < penultimateIx ? ", " : " "),
                i !== penultimateIx || 1 == n || truncated || L.push("and "),
                i >= limit - 1)
              ) {
                L.push("et al.");
                break;
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
          return Object(index_module.a)("span.author-list", L);
        },
        AuthorList_stories_names = [
          "Casey Idzikowski",
          "Daven Quinn",
          "Superman",
          "Batman",
          "Ironman",
          "Spiderman",
        ],
        AuthorList_stories_Template =
          ((__webpack_exports__.default = {
            title: "Example/AuthorList",
            component: author_list_AuthorList,
            argTypes: {},
          }),
          function Template(args) {
            return Object(index_module.a)(
              author_list_AuthorList,
              Object.assign({}, args)
            );
          }),
        NameList = AuthorList_stories_Template.bind({});
      NameList.args = { names: AuthorList_stories_names };
      var WithHighligh = AuthorList_stories_Template.bind({});
      (WithHighligh.args = {
        names: AuthorList_stories_names,
        highlight: "Batman",
      }),
        (NameList.parameters = Object.assign(
          {
            storySource: { source: "(args) =>\n  h(AuthorList, { ...args })" },
          },
          NameList.parameters
        )),
        (WithHighligh.parameters = Object.assign(
          {
            storySource: { source: "(args) =>\n  h(AuthorList, { ...args })" },
          },
          WithHighligh.parameters
        ));
    },
    "./src/concepts/concepts.stories.ts": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(
          __webpack_exports__,
          "PrevalentTaxaExample",
          function () {
            return concepts_stories_PrevalentTaxaExample;
          }
        );
      __webpack_require__("./node_modules/core-js/modules/es.object.assign.js");
      var index_module = __webpack_require__(
          "./node_modules/@macrostrat/hyper/dist/index.module.js"
        ),
        react =
          (__webpack_require__("./node_modules/core-js/modules/es.promise.js"),
          __webpack_require__(
            "./node_modules/core-js/modules/es.object.to-string.js"
          ),
          __webpack_require__("./node_modules/core-js/modules/es.array.map.js"),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.join.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.for-each.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/web.dom-collections.for-each.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.string.split.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.regexp.exec.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.is-array.js"
          ),
          __webpack_require__("./node_modules/core-js/modules/es.symbol.js"),
          __webpack_require__(
            "./node_modules/core-js/modules/es.symbol.description.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.symbol.iterator.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.string.iterator.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.iterator.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/web.dom-collections.iterator.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.slice.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.function.name.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.from.js"
          ),
          __webpack_require__("../../../node_modules/react/index.js")),
        axios = __webpack_require__("./node_modules/axios/index.js"),
        axios_default = __webpack_require__.n(axios),
        taxa_module = __webpack_require__("./src/concepts/taxa.module.styl"),
        taxa_module_default = __webpack_require__.n(taxa_module);
      function _slicedToArray(arr, i) {
        return (
          (function _arrayWithHoles(arr) {
            if (Array.isArray(arr)) return arr;
          })(arr) ||
          (function _iterableToArrayLimit(arr, i) {
            var _i =
              null == arr
                ? null
                : ("undefined" != typeof Symbol && arr[Symbol.iterator]) ||
                  arr["@@iterator"];
            if (null == _i) return;
            var _s,
              _e,
              _arr = [],
              _n = !0,
              _d = !1;
            try {
              for (
                _i = _i.call(arr);
                !(_n = (_s = _i.next()).done) &&
                (_arr.push(_s.value), !i || _arr.length !== i);
                _n = !0
              );
            } catch (err) {
              (_d = !0), (_e = err);
            } finally {
              try {
                _n || null == _i.return || _i.return();
              } finally {
                if (_d) throw _e;
              }
            }
            return _arr;
          })(arr, i) ||
          (function _unsupportedIterableToArray(o, minLen) {
            if (!o) return;
            if ("string" == typeof o) return _arrayLikeToArray(o, minLen);
            var n = Object.prototype.toString.call(o).slice(8, -1);
            "Object" === n && o.constructor && (n = o.constructor.name);
            if ("Map" === n || "Set" === n) return Array.from(o);
            if (
              "Arguments" === n ||
              /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
            )
              return _arrayLikeToArray(o, minLen);
          })(arr, i) ||
          (function _nonIterableRest() {
            throw new TypeError(
              "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
            );
          })()
        );
      }
      function _arrayLikeToArray(arr, len) {
        (null == len || len > arr.length) && (len = arr.length);
        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
        return arr2;
      }
      function asyncGeneratorStep(
        gen,
        resolve,
        reject,
        _next,
        _throw,
        key,
        arg
      ) {
        try {
          var info = gen[key](arg),
            value = info.value;
        } catch (error) {
          return void reject(error);
        }
        info.done ? resolve(value) : Promise.resolve(value).then(_next, _throw);
      }
      function _asyncToGenerator(fn) {
        return function () {
          var self = this,
            args = arguments;
          return new Promise(function (resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
              asyncGeneratorStep(
                gen,
                resolve,
                reject,
                _next,
                _throw,
                "next",
                value
              );
            }
            function _throw(err) {
              asyncGeneratorStep(
                gen,
                resolve,
                reject,
                _next,
                _throw,
                "throw",
                err
              );
            }
            _next(void 0);
          });
        };
      }
      var h = Object(index_module.b)(taxa_module_default.a),
        paleoUrl = "https://paleobiodb.org/data1.2/occs/prevalence.json";
      function fetchPrevalentTaxa(_x) {
        return _fetchPrevalentTaxa.apply(this, arguments);
      }
      function _fetchPrevalentTaxa() {
        return (_fetchPrevalentTaxa = _asyncToGenerator(
          regeneratorRuntime.mark(function _callee2(strat_name_id) {
            var res, collections, paleoRes;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
              for (;;)
                switch ((_context2.prev = _context2.next)) {
                  case 0:
                    return (
                      (_context2.next = 2),
                      axios_default.a.get(
                        "https://macrostrat.org/api/v2/fossils",
                        { params: { strat_name_id: strat_name_id } }
                      )
                    );
                  case 2:
                    if (
                      ((res = _context2.sent),
                      !(
                        (collections = res.data.success.data.map(function (c) {
                          return c.cltn_id;
                        })).length > 0
                      ))
                    ) {
                      _context2.next = 10;
                      break;
                    }
                    return (
                      (_context2.next = 7),
                      axios_default.a.get(paleoUrl, {
                        params: { limit: 5, coll_id: collections.join(",") },
                      })
                    );
                  case 7:
                    return (
                      (paleoRes = _context2.sent).data.records.forEach(
                        function (d) {
                          var splitName = d.nam.split(" ");
                          d.nam =
                            splitName[0] + (splitName.length > 1 ? "*" : "");
                        }
                      ),
                      _context2.abrupt("return", paleoRes)
                    );
                  case 10:
                    return _context2.abrupt("return", []);
                  case 11:
                  case "end":
                    return _context2.stop();
                }
            }, _callee2);
          })
        )).apply(this, arguments);
      }
      function PrevalentTaxa(_ref) {
        var strat_name_id = _ref.strat_name_id,
          _useState2 = _slicedToArray(Object(react.useState)([]), 2),
          state = _useState2[0],
          setState = _useState2[1];
        Object(react.useEffect)(
          function () {
            function _fetch() {
              return (_fetch = _asyncToGenerator(
                regeneratorRuntime.mark(function _callee() {
                  var data;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    for (;;)
                      switch ((_context.prev = _context.next)) {
                        case 0:
                          return (
                            (_context.next = 2),
                            fetchPrevalentTaxa(strat_name_id)
                          );
                        case 2:
                          (data = _context.sent), setState(data);
                        case 4:
                        case "end":
                          return _context.stop();
                      }
                  }, _callee);
                })
              )).apply(this, arguments);
            }
            !(function fetch() {
              return _fetch.apply(this, arguments);
            })();
          },
          [strat_name_id]
        );
        var containerClassName =
          state.length > 0 ? "row prevalent-taxa-row" : "hidden";
        return h("div." + containerClassName, [
          h("div.col-sm-2 prevalent-taxa-container", [
            h("div.prevalent-taxa", [
              h("p", { id: "prevalent-taxa-title" }, ["Prevalent taxa"]),
              h("p", [
                h("small", [
                  "via",
                  h(
                    "a.normalize-link",
                    { href: "https://paleobiodb.org", target: "_blank" },
                    ["PaleoBioDB"]
                  ),
                ]),
              ]),
            ]),
          ]),
        ]);
      }
      __webpack_exports__.default = {
        title: "Example/Concepts",
        component: PrevalentTaxa,
        args: {},
      };
      var concepts_stories_PrevalentTaxaExample = function PrevalentTaxaExample(
        _ref
      ) {
        var strat_name_id = _ref.strat_name_id;
        return Object(index_module.a)(PrevalentTaxa, {
          strat_name_id: strat_name_id,
        });
      };
      (concepts_stories_PrevalentTaxaExample.arguments = {
        strat_name_id: 1415,
      }),
        (concepts_stories_PrevalentTaxaExample.parameters = Object.assign(
          {
            storySource: {
              source:
                "function PrevalentTaxaExample({ strat_name_id }) {\n  return h(PrevalentTaxa, { strat_name_id });\n}",
            },
          },
          concepts_stories_PrevalentTaxaExample.parameters
        ));
    },
    "./src/concepts/taxa.module.styl": function (
      module,
      exports,
      __webpack_require__
    ) {
      var api = __webpack_require__(
          "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
        ),
        content = __webpack_require__(
          "./node_modules/css-loader/dist/cjs.js!./node_modules/stylus-loader/dist/cjs.js?!./src/concepts/taxa.module.styl"
        );
      "string" ==
        typeof (content = content.__esModule ? content.default : content) &&
        (content = [[module.i, content, ""]]);
      var options = { insert: "head", singleton: !1 };
      api(content, options);
      module.exports = content.locals || {};
    },
    "./src/hierarchy/hierarchy.module.styl": function (
      module,
      exports,
      __webpack_require__
    ) {
      var api = __webpack_require__(
          "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
        ),
        content = __webpack_require__(
          "./node_modules/css-loader/dist/cjs.js!./node_modules/stylus-loader/dist/cjs.js?!./src/hierarchy/hierarchy.module.styl"
        );
      "string" ==
        typeof (content = content.__esModule ? content.default : content) &&
        (content = [[module.i, content, ""]]);
      var options = { insert: "head", singleton: !1 };
      api(content, options);
      module.exports = content.locals || {};
    },
    "./src/hierarchy/hierarchy.stories.ts": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(
          __webpack_exports__,
          "SimpleHierarchy",
          function () {
            return SimpleHierarchy;
          }
        ),
        __webpack_require__.d(
          __webpack_exports__,
          "StratNameHierarchy",
          function () {
            return hierarchy_stories_StratNameHierarchy;
          }
        );
      __webpack_require__("./node_modules/core-js/modules/es.object.assign.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.bind.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.promise.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.object.to-string.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.name.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.is-array.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.symbol.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.symbol.description.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.symbol.iterator.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.string.iterator.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.iterator.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/web.dom-collections.iterator.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.array.slice.js"),
        __webpack_require__("./node_modules/core-js/modules/es.array.from.js");
      var react = __webpack_require__("../../../node_modules/react/index.js"),
        index_module = __webpack_require__(
          "./node_modules/@macrostrat/hyper/dist/index.module.js"
        ),
        hierarchy_module =
          (__webpack_require__(
            "./node_modules/core-js/modules/es.array.map.js"
          ),
          __webpack_require__("./src/hierarchy/hierarchy.module.styl")),
        hierarchy_module_default = __webpack_require__.n(hierarchy_module),
        h = Object(index_module.b)(hierarchy_module_default.a);
      function Hierarchy(props) {
        console.log(props);
        var _props$kinder = props.kinder,
          kinder = void 0 === _props$kinder ? [] : _props$kinder,
          _props$units = props.units,
          units = void 0 === _props$units ? 0 : _props$units,
          name = props.name,
          _props$active = props.active,
          active = void 0 !== _props$active && _props$active,
          _props$onClick = props.onClick;
        return h(
          "div.hierarchy-container  " + (active ? ".active" : ""),
          {
            onClick:
              void 0 === _props$onClick ? function (e) {} : _props$onClick,
          },
          [
            h("div.hierarchy-name", [name, h("span.badge", [units])]),
            h.if(kinder.length > 0)("div.hierarchy-children", [
              kinder.map(function (c, i) {
                return h(Hierarchy, Object.assign({}, c, { key: i }));
              }),
            ]),
          ]
        );
      }
      __webpack_require__(
        "./node_modules/core-js/modules/es.array.for-each.js"
      ),
        __webpack_require__(
          "./node_modules/core-js/modules/web.dom-collections.for-each.js"
        ),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.filter.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.array.sort.js");
      var axios = __webpack_require__("./node_modules/axios/index.js"),
        axios_default = __webpack_require__.n(axios);
      function asyncGeneratorStep(
        gen,
        resolve,
        reject,
        _next,
        _throw,
        key,
        arg
      ) {
        try {
          var info = gen[key](arg),
            value = info.value;
        } catch (error) {
          return void reject(error);
        }
        info.done ? resolve(value) : Promise.resolve(value).then(_next, _throw);
      }
      var rankMap = {
          SGp: null,
          Gp: "sgp",
          SubGp: "gp",
          Fm: "subgp",
          Mbr: "fm",
          Bed: "mbr",
          1: null,
          2: "sgp",
          3: "gp",
          4: "subgp",
          5: "fm",
          6: "mbr",
        },
        rankMapOrder = { SGp: 1, Gp: 2, SubGp: 3, Fm: 4, Mbr: 5, Bed: 6 },
        fetchStratNames = (function () {
          var _ref = (function _asyncToGenerator(fn) {
            return function () {
              var self = this,
                args = arguments;
              return new Promise(function (resolve, reject) {
                var gen = fn.apply(self, args);
                function _next(value) {
                  asyncGeneratorStep(
                    gen,
                    resolve,
                    reject,
                    _next,
                    _throw,
                    "next",
                    value
                  );
                }
                function _throw(err) {
                  asyncGeneratorStep(
                    gen,
                    resolve,
                    reject,
                    _next,
                    _throw,
                    "throw",
                    err
                  );
                }
                _next(void 0);
              });
            };
          })(
            regeneratorRuntime.mark(function _callee(id) {
              var res, data, hierarchy, mappedData;
              return regeneratorRuntime.wrap(function _callee$(_context) {
                for (;;)
                  switch ((_context.prev = _context.next)) {
                    case 0:
                      return (
                        (_context.next = 2),
                        axios_default.a.get(
                          "https://macrostrat.org/api/v2/defs/strat_names",
                          { params: { rule: "all", strat_name_id: id } }
                        )
                      );
                    case 2:
                      if (200 == (res = _context.sent).status) {
                        _context.next = 5;
                        break;
                      }
                      return _context.abrupt("return", res.data);
                    case 5:
                      return (
                        (data = res.data.success.data).forEach(function (d) {
                          (d.active = !1),
                            d.strat_name_id == id && (d.active = !0),
                            (d.children = []),
                            (d.totalChildren =
                              data.filter(function (j) {
                                if (
                                  j[d.rank.toLowerCase() + "_id"] ==
                                  d.strat_name_id
                                )
                                  return j;
                              }).length - 1),
                            (d.total = d.totalChildren);
                        }),
                        data.forEach(function (d) {
                          for (
                            var belongsTo = d[rankMap[d.rank] + "_id"],
                              previousRank = 1;
                            0 === belongsTo;

                          )
                            (belongsTo =
                              d[
                                rankMap[rankMapOrder[d.rank] - previousRank] +
                                  "_id"
                              ]),
                              previousRank--;
                          data.forEach(function (j) {
                            j.strat_name_id == belongsTo &&
                              j.strat_name_id != d.strat_name_id &&
                              j.children.push(d);
                          });
                        }),
                        (hierarchy = data.sort(function (a, b) {
                          return b.totalChildren - a.totalChildren;
                        })[0]),
                        (mappedData = mapToHier(hierarchy)),
                        _context.abrupt("return", mappedData)
                      );
                    case 11:
                    case "end":
                      return _context.stop();
                  }
              }, _callee);
            })
          );
          return function fetchStratNames(_x) {
            return _ref.apply(this, arguments);
          };
        })(),
        mapToHier = function mapToHier(data) {
          var Hier = {};
          return (
            (Hier.name = data.strat_name),
            (Hier.units = data.t_units),
            (Hier.active = data.active),
            (Hier.onClick = function (e) {
              e.preventDefault();
              var url =
                "https://macrostrat.org/sift/#/strat_name/" +
                data.strat_name_id;
              window.open(url, "_blank").focus();
            }),
            (Hier.kinder = data.children.map(function (c) {
              return mapToHier(c);
            })),
            Hier
          );
        },
        components = __webpack_require__(
          "./node_modules/@blueprintjs/core/lib/esm/components/index.js"
        );
      function hierarchy_stories_asyncGeneratorStep(
        gen,
        resolve,
        reject,
        _next,
        _throw,
        key,
        arg
      ) {
        try {
          var info = gen[key](arg),
            value = info.value;
        } catch (error) {
          return void reject(error);
        }
        info.done ? resolve(value) : Promise.resolve(value).then(_next, _throw);
      }
      function hierarchy_stories_asyncToGenerator(fn) {
        return function () {
          var self = this,
            args = arguments;
          return new Promise(function (resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
              hierarchy_stories_asyncGeneratorStep(
                gen,
                resolve,
                reject,
                _next,
                _throw,
                "next",
                value
              );
            }
            function _throw(err) {
              hierarchy_stories_asyncGeneratorStep(
                gen,
                resolve,
                reject,
                _next,
                _throw,
                "throw",
                err
              );
            }
            _next(void 0);
          });
        };
      }
      function _slicedToArray(arr, i) {
        return (
          (function _arrayWithHoles(arr) {
            if (Array.isArray(arr)) return arr;
          })(arr) ||
          (function _iterableToArrayLimit(arr, i) {
            var _i =
              null == arr
                ? null
                : ("undefined" != typeof Symbol && arr[Symbol.iterator]) ||
                  arr["@@iterator"];
            if (null == _i) return;
            var _s,
              _e,
              _arr = [],
              _n = !0,
              _d = !1;
            try {
              for (
                _i = _i.call(arr);
                !(_n = (_s = _i.next()).done) &&
                (_arr.push(_s.value), !i || _arr.length !== i);
                _n = !0
              );
            } catch (err) {
              (_d = !0), (_e = err);
            } finally {
              try {
                _n || null == _i.return || _i.return();
              } finally {
                if (_d) throw _e;
              }
            }
            return _arr;
          })(arr, i) ||
          (function _unsupportedIterableToArray(o, minLen) {
            if (!o) return;
            if ("string" == typeof o) return _arrayLikeToArray(o, minLen);
            var n = Object.prototype.toString.call(o).slice(8, -1);
            "Object" === n && o.constructor && (n = o.constructor.name);
            if ("Map" === n || "Set" === n) return Array.from(o);
            if (
              "Arguments" === n ||
              /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
            )
              return _arrayLikeToArray(o, minLen);
          })(arr, i) ||
          (function _nonIterableRest() {
            throw new TypeError(
              "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
            );
          })()
        );
      }
      function _arrayLikeToArray(arr, len) {
        (null == len || len > arr.length) && (len = arr.length);
        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
        return arr2;
      }
      __webpack_exports__.default = {
        title: "Example/Hierarchy",
        component: Hierarchy,
        args: {},
      };
      var SimpleHierarchy = function Template(args) {
        return Object(index_module.a)(Hierarchy, Object.assign({}, args));
      }.bind({});
      SimpleHierarchy.args = {
        name: "Rocks",
        kinder: [
          {
            name: "Igneous",
            units: 10,
            active: !1,
            kinder: [
              { name: "Rhyolite", units: 2, active: !0, kinder: [] },
              { name: "Granite", units: 5, active: !1, kinder: [] },
            ],
          },
          {
            name: "Sedimentary",
            units: 100,
            active: !1,
            kinder: [
              { name: "Limestone", units: 2, active: !1, kinder: [] },
              {
                name: "Sandstone",
                units: 5,
                active: !1,
                kinder: [{ name: "arkose", units: 2, active: !1, kinder: [] }],
              },
            ],
          },
        ],
        active: !1,
        units: 120,
      };
      var hierarchy_stories_StratNameHierarchy = function StratNameHierarchy(
        _ref
      ) {
        var strat_name_id = _ref.strat_name_id,
          _useState2 = _slicedToArray(Object(react.useState)({}), 2),
          state = _useState2[0],
          setState = _useState2[1];
        return (
          console.log(state),
          Object(react.useEffect)(
            function () {
              function _fetch() {
                return (_fetch = hierarchy_stories_asyncToGenerator(
                  regeneratorRuntime.mark(function _callee() {
                    var res;
                    return regeneratorRuntime.wrap(function _callee$(_context) {
                      for (;;)
                        switch ((_context.prev = _context.next)) {
                          case 0:
                            return (
                              (_context.next = 2),
                              fetchStratNames(strat_name_id)
                            );
                          case 2:
                            (res = _context.sent), setState(res);
                          case 4:
                          case "end":
                            return _context.stop();
                        }
                    }, _callee);
                  })
                )).apply(this, arguments);
              }
              !(function fetch() {
                return _fetch.apply(this, arguments);
              })();
            },
            [strat_name_id]
          ),
          state.name
            ? Object(index_module.a)("div", [
                Object(index_module.a)("h3", [
                  "A strat name hierarchy from macrostrat",
                ]),
                Object(index_module.a)(Hierarchy, Object.assign({}, state)),
              ])
            : Object(index_module.a)(components.e)
        );
      };
      (hierarchy_stories_StratNameHierarchy.args = { strat_name_id: 9574 }),
        (SimpleHierarchy.parameters = Object.assign(
          { storySource: { source: "(args) =>\n  h(Hierarchy, { ...args })" } },
          SimpleHierarchy.parameters
        )),
        (hierarchy_stories_StratNameHierarchy.parameters = Object.assign(
          {
            storySource: {
              source:
                'function StratNameHierarchy({ strat_name_id }) {\n  const [state, setState] = useState<Partial<IHierarchy>>({});\n  console.log(state);\n\n  useEffect(() => {\n    async function fetch() {\n      const res = await fetchStratNames(strat_name_id);\n      setState(res);\n    }\n    fetch();\n  }, [strat_name_id]);\n\n  if (!state.name) {\n    return h(Spinner);\n  }\n\n  return h("div", [\n    h("h3", ["A strat name hierarchy from macrostrat"]),\n    h(Hierarchy, { ...state }),\n  ]);\n}',
            },
          },
          hierarchy_stories_StratNameHierarchy.parameters
        ));
    },
    "./src/modal-panel/ModalPanel.stories.ts": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(__webpack_exports__, "BasePanel", function () {
          return BasePanel;
        }),
        __webpack_require__.d(__webpack_exports__, "MinimalPanel", function () {
          return MinimalPanel;
        });
      __webpack_require__("./node_modules/core-js/modules/es.object.assign.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.bind.js"
        );
      var index_module = __webpack_require__(
          "./node_modules/@macrostrat/hyper/dist/index.module.js"
        ),
        components =
          (__webpack_require__(
            "./node_modules/core-js/modules/es.object.keys.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.index-of.js"
          ),
          __webpack_require__("./node_modules/core-js/modules/es.symbol.js"),
          __webpack_require__(
            "./node_modules/@blueprintjs/core/lib/esm/components/index.js"
          )),
        main_module = __webpack_require__("./src/modal-panel/main.module.styl"),
        _excluded = ["children", "className", "style", "headerChildren"],
        _excluded2 = [
          "children",
          "className",
          "style",
          "minimal",
          "headerChildren",
        ];
      function _objectWithoutProperties(source, excluded) {
        if (null == source) return {};
        var key,
          i,
          target = (function _objectWithoutPropertiesLoose(source, excluded) {
            if (null == source) return {};
            var key,
              i,
              target = {},
              sourceKeys = Object.keys(source);
            for (i = 0; i < sourceKeys.length; i++)
              (key = sourceKeys[i]),
                excluded.indexOf(key) >= 0 || (target[key] = source[key]);
            return target;
          })(source, excluded);
        if (Object.getOwnPropertySymbols) {
          var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
          for (i = 0; i < sourceSymbolKeys.length; i++)
            (key = sourceSymbolKeys[i]),
              excluded.indexOf(key) >= 0 ||
                (Object.prototype.propertyIsEnumerable.call(source, key) &&
                  (target[key] = source[key]));
        }
        return target;
      }
      var h = Object(index_module.b)(main_module),
        modal_panel_PanelHeader = function PanelHeader(props) {
          var title = props.title,
            onClose = props.onClose,
            children = props.children;
          return h("div.panel-header", [
            h.if(null != title)("h1.title", null, title),
            h.if(null != children)([
              h("div.expander"),
              children,
              h("div.extra-space"),
            ]),
            h(components.b, { minimal: !0, icon: "cross", onClick: onClose }),
          ]);
        };
      function MinimalModalPanel(props) {
        var children = props.children,
          className = props.className,
          style = props.style,
          headerChildren = props.headerChildren,
          rest = _objectWithoutProperties(props, _excluded);
        return h("div.panel-column", [
          h("div.panel.minimal", { className: className, style: style }, [
            h(modal_panel_PanelHeader, rest, headerChildren),
            h("div.panel-content", null, children),
          ]),
          h("div.expander"),
        ]);
      }
      function ModalPanel(props) {
        var children = props.children,
          className = props.className,
          style = props.style,
          _props$minimal = props.minimal,
          minimal = void 0 !== _props$minimal && _props$minimal,
          _props$headerChildren = props.headerChildren,
          headerChildren =
            void 0 === _props$headerChildren ? null : _props$headerChildren,
          rest = _objectWithoutProperties(props, _excluded2);
        return minimal
          ? h(
              MinimalModalPanel,
              Object.assign({}, rest, {
                children: children,
                headerChildren: headerChildren,
                className: className,
                style: style,
              })
            )
          : h("div.panel-column", [
              h("div.panel-container", [
                h("div.panel-container-inner", [
                  h("div.panel-outer", [
                    h("div.panel", { className: className, style: style }, [
                      h(modal_panel_PanelHeader, rest, headerChildren),
                      h("div.panel-content", null, children),
                    ]),
                    h("div.expander"),
                  ]),
                ]),
              ]),
            ]);
      }
      __webpack_exports__.default = {
        title: "Example/ModalPanel",
        component: ModalPanel,
        args: {
          onClose: function onClose() {
            return console.log("Close Action Triggered");
          },
          title: "Base Modal Panel",
          headerChildren: Object(index_module.a)("div", ["Header Child"]),
          children: Object(index_module.a)("div", [
            Object(index_module.a)("div", ["Panel Child One"]),
            Object(index_module.a)("div", ["Panel Child Two"]),
            Object(index_module.a)("div", ["Panel Child Three"]),
          ]),
        },
      };
      var ModalPanel_stories_Template = function Template(args) {
          return Object(index_module.a)(ModalPanel, Object.assign({}, args));
        },
        BasePanel = ModalPanel_stories_Template.bind({});
      BasePanel.args = {};
      var MinimalPanel = ModalPanel_stories_Template.bind({});
      (MinimalPanel.args = { minimal: !0 }),
        (BasePanel.parameters = Object.assign(
          {
            storySource: { source: "(args) =>\n  h(ModalPanel, { ...args })" },
          },
          BasePanel.parameters
        )),
        (MinimalPanel.parameters = Object.assign(
          {
            storySource: { source: "(args) =>\n  h(ModalPanel, { ...args })" },
          },
          MinimalPanel.parameters
        ));
    },
    "./src/modal-panel/main.module.styl": function (
      module,
      exports,
      __webpack_require__
    ) {
      var api = __webpack_require__(
          "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
        ),
        content = __webpack_require__(
          "./node_modules/css-loader/dist/cjs.js!./node_modules/stylus-loader/dist/cjs.js?!./src/modal-panel/main.module.styl"
        );
      "string" ==
        typeof (content = content.__esModule ? content.default : content) &&
        (content = [[module.i, content, ""]]);
      var options = { insert: "head", singleton: !1 };
      api(content, options);
      module.exports = content.locals || {};
    },
    "./src/panel-stack/PanelStack.stories.ts": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(
          __webpack_exports__,
          "PanelStackExample",
          function () {
            return PanelStackExample;
          }
        );
      __webpack_require__("./node_modules/core-js/modules/es.object.assign.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.bind.js"
        );
      var index_module = __webpack_require__(
          "./node_modules/@macrostrat/hyper/dist/index.module.js"
        ),
        components = __webpack_require__(
          "./node_modules/@blueprintjs/core/lib/esm/components/index.js"
        ),
        react =
          (__webpack_require__("./src/panel-stack/panel.styl"),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.concat.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.slice.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.is-array.js"
          ),
          __webpack_require__("./node_modules/core-js/modules/es.symbol.js"),
          __webpack_require__(
            "./node_modules/core-js/modules/es.symbol.description.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.object.to-string.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.symbol.iterator.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.string.iterator.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.iterator.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/web.dom-collections.iterator.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.function.name.js"
          ),
          __webpack_require__(
            "./node_modules/core-js/modules/es.array.from.js"
          ),
          __webpack_require__("../../../node_modules/react/index.js")),
        react_default = __webpack_require__.n(react);
      function _toConsumableArray(arr) {
        return (
          (function _arrayWithoutHoles(arr) {
            if (Array.isArray(arr)) return _arrayLikeToArray(arr);
          })(arr) ||
          (function _iterableToArray(iter) {
            if (
              ("undefined" != typeof Symbol && null != iter[Symbol.iterator]) ||
              null != iter["@@iterator"]
            )
              return Array.from(iter);
          })(arr) ||
          _unsupportedIterableToArray(arr) ||
          (function _nonIterableSpread() {
            throw new TypeError(
              "Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
            );
          })()
        );
      }
      function _slicedToArray(arr, i) {
        return (
          (function _arrayWithHoles(arr) {
            if (Array.isArray(arr)) return arr;
          })(arr) ||
          (function _iterableToArrayLimit(arr, i) {
            var _i =
              null == arr
                ? null
                : ("undefined" != typeof Symbol && arr[Symbol.iterator]) ||
                  arr["@@iterator"];
            if (null == _i) return;
            var _s,
              _e,
              _arr = [],
              _n = !0,
              _d = !1;
            try {
              for (
                _i = _i.call(arr);
                !(_n = (_s = _i.next()).done) &&
                (_arr.push(_s.value), !i || _arr.length !== i);
                _n = !0
              );
            } catch (err) {
              (_d = !0), (_e = err);
            } finally {
              try {
                _n || null == _i.return || _i.return();
              } finally {
                if (_d) throw _e;
              }
            }
            return _arr;
          })(arr, i) ||
          _unsupportedIterableToArray(arr, i) ||
          (function _nonIterableRest() {
            throw new TypeError(
              "Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."
            );
          })()
        );
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (o) {
          if ("string" == typeof o) return _arrayLikeToArray(o, minLen);
          var n = Object.prototype.toString.call(o).slice(8, -1);
          return (
            "Object" === n && o.constructor && (n = o.constructor.name),
            "Map" === n || "Set" === n
              ? Array.from(o)
              : "Arguments" === n ||
                /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)
              ? _arrayLikeToArray(o, minLen)
              : void 0
          );
        }
      }
      function _arrayLikeToArray(arr, len) {
        (null == len || len > arr.length) && (len = arr.length);
        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
        return arr2;
      }
      function PanelStack(props) {
        var _useState2 = _slicedToArray(
            Object(react.useState)([props.initialPanel]),
            2
          ),
          currentStack = _useState2[0],
          setCurrentStack = _useState2[1],
          addToPanelStack = react_default.a.useCallback(function (newPanel) {
            return setCurrentStack(function (stack) {
              return [].concat(_toConsumableArray(stack), [newPanel]);
            });
          }, []),
          removeFromPanelStack = react_default.a.useCallback(function () {
            return setCurrentStack(function (stack) {
              return stack.slice(0, -1);
            });
          }, []);
        return Object(index_module.a)(
          components.c,
          {
            style: { margin: "0", padding: "0" },
            elevation: props.elevation || 1,
          },
          [
            Object(index_module.a)(components.d, {
              className: props.className,
              onOpen: addToPanelStack,
              onClose: removeFromPanelStack,
              renderActivePanelOnly: props.renderActivePanelOnly || !0,
              showPanelHeader: !0,
              stack: currentStack,
            }),
          ]
        );
      }
      function First(props) {
        return Object(index_module.a)("div.panel-content", [
          "First Panel",
          Object(index_module.a)(
            components.b,
            {
              onClick: function openNewPanel() {
                props.openPanel({
                  props: {},
                  renderPanel: Second,
                  title: "Second Panel",
                });
              },
              intent: "primary",
            },
            ["Open Second Panel"]
          ),
        ]);
      }
      function Second(props) {
        return Object(index_module.a)("div.panel-content", [
          "First Panel",
          Object(index_module.a)(
            components.b,
            {
              onClick: function openNewPanel() {
                props.openPanel({
                  props: {},
                  renderPanel: Third,
                  title: "Third Panel",
                });
              },
              intent: "success",
            },
            ["Open Third Panel"]
          ),
        ]);
      }
      function Third(props) {
        return Object(index_module.a)("div.panel-content", [
          "First Panel",
          Object(index_module.a)(
            components.b,
            {
              onClick: function openNewPanel() {
                props.openPanel({
                  props: {},
                  renderPanel: First,
                  title: "First Panel",
                });
              },
              intent: "danger",
            },
            ["Start Over!"]
          ),
        ]);
      }
      var initialPanel = {
          props: { panelNumber: 1 },
          renderPanel: First,
          title: "First Panel",
        },
        PanelStackExample =
          ((__webpack_exports__.default = {
            title: "Example/PanelStack",
            component: PanelStack,
            args: {
              initialPanel: initialPanel,
              className: "stack",
              renderActivePanelOnly: !0,
            },
          }),
          function Template(args) {
            return Object(index_module.a)(PanelStack, Object.assign({}, args));
          }.bind({}));
      (PanelStackExample.args = {}),
        (PanelStackExample.parameters = Object.assign(
          {
            storySource: { source: "(args) =>\n  h(PanelStack, { ...args })" },
          },
          PanelStackExample.parameters
        ));
    },
    "./src/panel-stack/panel.styl": function (
      module,
      exports,
      __webpack_require__
    ) {
      var api = __webpack_require__(
          "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
        ),
        content = __webpack_require__(
          "./node_modules/css-loader/dist/cjs.js!./node_modules/stylus-loader/dist/cjs.js?!./src/panel-stack/panel.styl"
        );
      "string" ==
        typeof (content = content.__esModule ? content.default : content) &&
        (content = [[module.i, content, ""]]);
      var options = { insert: "head", singleton: !1 };
      api(content, options);
      module.exports = content.locals || {};
    },
    "./src/stories/Header.stories.tsx": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(__webpack_exports__, "LoggedIn", function () {
          return LoggedIn;
        }),
        __webpack_require__.d(__webpack_exports__, "LoggedOut", function () {
          return LoggedOut;
        });
      __webpack_require__("./node_modules/core-js/modules/es.object.assign.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.bind.js"
        ),
        __webpack_require__("../../../node_modules/react/index.js");
      var _Header__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
          "./src/stories/Header.tsx"
        ),
        react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(
          "../../../node_modules/react/jsx-runtime.js"
        );
      __webpack_exports__.default = {
        title: "Example/Header",
        component: _Header__WEBPACK_IMPORTED_MODULE_3__.a,
      };
      var Template = function Template(args) {
        return Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_4__.jsx)(
          _Header__WEBPACK_IMPORTED_MODULE_3__.a,
          Object.assign({}, args)
        );
      };
      Template.displayName = "Template";
      var LoggedIn = Template.bind({});
      LoggedIn.args = { user: {} };
      var LoggedOut = Template.bind({});
      (LoggedOut.args = {}),
        (LoggedIn.parameters = Object.assign(
          { storySource: { source: "(args) => <Header {...args} />" } },
          LoggedIn.parameters
        )),
        (LoggedOut.parameters = Object.assign(
          { storySource: { source: "(args) => <Header {...args} />" } },
          LoggedOut.parameters
        ));
    },
    "./src/stories/Header.tsx": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.d(__webpack_exports__, "a", function () {
        return Header;
      });
      __webpack_require__("../../../node_modules/react/index.js"),
        __webpack_require__("./src/stories/header.css");
      var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
          "../../../node_modules/react/jsx-runtime.js"
        ),
        Header = function Header(_ref) {
          _ref.user, _ref.onLogin, _ref.onLogout, _ref.onCreateAccount;
          return Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(
            "header",
            {
              children: Object(
                react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs
              )("div", {
                className: "wrapper",
                children: [
                  Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)(
                    "div",
                    {
                      children: [
                        Object(
                          react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx
                        )("svg", {
                          width: "32",
                          height: "32",
                          viewBox: "0 0 32 32",
                          xmlns: "http://www.w3.org/2000/svg",
                          children: Object(
                            react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs
                          )("g", {
                            fill: "none",
                            fillRule: "evenodd",
                            children: [
                              Object(
                                react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx
                              )("path", {
                                d: "M10 0h12a10 10 0 0110 10v12a10 10 0 01-10 10H10A10 10 0 010 22V10A10 10 0 0110 0z",
                                fill: "#FFF",
                              }),
                              Object(
                                react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx
                              )("path", {
                                d: "M5.3 10.6l10.4 6v11.1l-10.4-6v-11zm11.4-6.2l9.7 5.5-9.7 5.6V4.4z",
                                fill: "#555AB9",
                              }),
                              Object(
                                react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx
                              )("path", {
                                d: "M27.2 10.6v11.2l-10.5 6V16.5l10.5-6zM15.7 4.4v11L6 10l9.7-5.5z",
                                fill: "#91BAF8",
                              }),
                            ],
                          }),
                        }),
                        Object(
                          react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx
                        )("h1", { children: "Acme" }),
                      ],
                    }
                  ),
                  Object(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(
                    "div",
                    {}
                  ),
                ],
              }),
            }
          );
        };
      Header.displayName = "Header";
      try {
        (Header.displayName = "Header"),
          (Header.__docgenInfo = {
            description: "",
            displayName: "Header",
            props: {
              user: {
                defaultValue: null,
                description: "",
                name: "user",
                required: !1,
                type: { name: "{}" },
              },
              onLogin: {
                defaultValue: null,
                description: "",
                name: "onLogin",
                required: !0,
                type: { name: "() => void" },
              },
              onLogout: {
                defaultValue: null,
                description: "",
                name: "onLogout",
                required: !0,
                type: { name: "() => void" },
              },
              onCreateAccount: {
                defaultValue: null,
                description: "",
                name: "onCreateAccount",
                required: !0,
                type: { name: "() => void" },
              },
            },
          }),
          "undefined" != typeof STORYBOOK_REACT_CLASSES &&
            (STORYBOOK_REACT_CLASSES["src/stories/Header.tsx#Header"] = {
              docgenInfo: Header.__docgenInfo,
              name: "Header",
              path: "src/stories/Header.tsx#Header",
            });
      } catch (__react_docgen_typescript_loader_error) {}
    },
    "./src/stories/Introduction.stories.mdx": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(__webpack_exports__, "__page", function () {
          return __page;
        });
      __webpack_require__("./node_modules/core-js/modules/es.object.keys.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.array.index-of.js"
        ),
        __webpack_require__("./node_modules/core-js/modules/es.symbol.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.object.assign.js"
        ),
        __webpack_require__("../../../node_modules/react/index.js");
      var _mdx_js_react__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(
          "./node_modules/@mdx-js/react/dist/esm.js"
        ),
        _storybook_addon_docs__WEBPACK_IMPORTED_MODULE_6__ =
          __webpack_require__(
            "./node_modules/@storybook/addon-docs/dist/esm/index.js"
          ),
        _assets_code_brackets_svg__WEBPACK_IMPORTED_MODULE_7__ =
          __webpack_require__("./src/stories/assets/code-brackets.svg"),
        _assets_code_brackets_svg__WEBPACK_IMPORTED_MODULE_7___default =
          __webpack_require__.n(
            _assets_code_brackets_svg__WEBPACK_IMPORTED_MODULE_7__
          ),
        _assets_colors_svg__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(
          "./src/stories/assets/colors.svg"
        ),
        _assets_colors_svg__WEBPACK_IMPORTED_MODULE_8___default =
          __webpack_require__.n(
            _assets_colors_svg__WEBPACK_IMPORTED_MODULE_8__
          ),
        _assets_comments_svg__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(
          "./src/stories/assets/comments.svg"
        ),
        _assets_comments_svg__WEBPACK_IMPORTED_MODULE_9___default =
          __webpack_require__.n(
            _assets_comments_svg__WEBPACK_IMPORTED_MODULE_9__
          ),
        _assets_direction_svg__WEBPACK_IMPORTED_MODULE_10__ =
          __webpack_require__("./src/stories/assets/direction.svg"),
        _assets_direction_svg__WEBPACK_IMPORTED_MODULE_10___default =
          __webpack_require__.n(
            _assets_direction_svg__WEBPACK_IMPORTED_MODULE_10__
          ),
        _assets_flow_svg__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(
          "./src/stories/assets/flow.svg"
        ),
        _assets_flow_svg__WEBPACK_IMPORTED_MODULE_11___default =
          __webpack_require__.n(_assets_flow_svg__WEBPACK_IMPORTED_MODULE_11__),
        _assets_plugin_svg__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(
          "./src/stories/assets/plugin.svg"
        ),
        _assets_plugin_svg__WEBPACK_IMPORTED_MODULE_12___default =
          __webpack_require__.n(
            _assets_plugin_svg__WEBPACK_IMPORTED_MODULE_12__
          ),
        _assets_repo_svg__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(
          "./src/stories/assets/repo.svg"
        ),
        _assets_repo_svg__WEBPACK_IMPORTED_MODULE_13___default =
          __webpack_require__.n(_assets_repo_svg__WEBPACK_IMPORTED_MODULE_13__),
        _assets_stackalt_svg__WEBPACK_IMPORTED_MODULE_14__ =
          __webpack_require__("./src/stories/assets/stackalt.svg"),
        _assets_stackalt_svg__WEBPACK_IMPORTED_MODULE_14___default =
          __webpack_require__.n(
            _assets_stackalt_svg__WEBPACK_IMPORTED_MODULE_14__
          ),
        _excluded = ["components"];
      function _extends() {
        return (
          (_extends =
            Object.assign ||
            function (target) {
              for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                for (var key in source)
                  Object.prototype.hasOwnProperty.call(source, key) &&
                    (target[key] = source[key]);
              }
              return target;
            }),
          _extends.apply(this, arguments)
        );
      }
      function _objectWithoutProperties(source, excluded) {
        if (null == source) return {};
        var key,
          i,
          target = (function _objectWithoutPropertiesLoose(source, excluded) {
            if (null == source) return {};
            var key,
              i,
              target = {},
              sourceKeys = Object.keys(source);
            for (i = 0; i < sourceKeys.length; i++)
              (key = sourceKeys[i]),
                excluded.indexOf(key) >= 0 || (target[key] = source[key]);
            return target;
          })(source, excluded);
        if (Object.getOwnPropertySymbols) {
          var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
          for (i = 0; i < sourceSymbolKeys.length; i++)
            (key = sourceSymbolKeys[i]),
              excluded.indexOf(key) >= 0 ||
                (Object.prototype.propertyIsEnumerable.call(source, key) &&
                  (target[key] = source[key]));
        }
        return target;
      }
      var layoutProps = {};
      function MDXContent(_ref) {
        var components = _ref.components,
          props = _objectWithoutProperties(_ref, _excluded);
        return Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
          "wrapper",
          _extends({}, layoutProps, props, {
            components: components,
            mdxType: "MDXLayout",
          }),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            _storybook_addon_docs__WEBPACK_IMPORTED_MODULE_6__.b,
            { title: "Example/Introduction", mdxType: "Meta" }
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "style",
            null,
            "\n  .subheading {\n    --mediumdark: '#999999';\n    font-weight: 900;\n    font-size: 13px;\n    color: #999;\n    letter-spacing: 6px;\n    line-height: 24px;\n    text-transform: uppercase;\n    margin-bottom: 12px;\n    margin-top: 40px;\n  }\n\n  .link-list {\n    display: grid;\n    grid-template-columns: 1fr;\n    grid-template-rows: 1fr 1fr;\n    row-gap: 10px;\n  }\n\n  @media (min-width: 620px) {\n    .link-list {\n      row-gap: 20px;\n      column-gap: 20px;\n      grid-template-columns: 1fr 1fr;\n    }\n  }\n\n  @media all and (-ms-high-contrast:none) {\n  .link-list {\n      display: -ms-grid;\n      -ms-grid-columns: 1fr 1fr;\n      -ms-grid-rows: 1fr 1fr;\n    }\n  }\n\n  .link-item {\n    display: block;\n    padding: 20px 30px 20px 15px;\n    border: 1px solid #00000010;\n    border-radius: 5px;\n    transition: background 150ms ease-out, border 150ms ease-out, transform 150ms ease-out;\n    color: #333333;\n    display: flex;\n    align-items: flex-start;\n  }\n\n  .link-item:hover {\n    border-color: #1EA7FD50;\n    transform: translate3d(0, -3px, 0);\n    box-shadow: rgba(0, 0, 0, 0.08) 0 3px 10px 0;\n  }\n\n  .link-item:active {\n    border-color: #1EA7FD;\n    transform: translate3d(0, 0, 0);\n  }\n\n  .link-item strong {\n    font-weight: 700;\n    display: block;\n    margin-bottom: 2px;\n  }\n  \n  .link-item img {\n    height: 40px;\n    width: 40px;\n    margin-right: 15px;\n    flex: none;\n  }\n\n  .link-item span {\n    font-size: 14px;\n    line-height: 20px;\n  }\n\n  .tip {\n    display: inline-block;\n    border-radius: 1em;\n    font-size: 11px;\n    line-height: 12px;\n    font-weight: 700;\n    background: #E7FDD8;\n    color: #66BF3C;\n    padding: 4px 12px;\n    margin-right: 10px;\n    vertical-align: top;\n  }\n\n  .tip-wrapper {\n    font-size: 13px;\n    line-height: 20px;\n    margin-top: 40px;\n    margin-bottom: 40px;\n  }\n\n  .tip-wrapper code {\n    font-size: 12px;\n    display: inline-block;\n  }\n\n  \n"
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "h1",
            { id: "welcome-to-storybook" },
            "Welcome to Storybook"
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "p",
            null,
            "Storybook helps you build UI components in isolation from your app's business logic, data, and context.\nThat makes it easy to develop hard-to-reach states. Save these UI states as ",
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "strong",
              { parentName: "p" },
              "stories"
            ),
            " to revisit during development, testing, or QA."
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "p",
            null,
            "Browse example stories now by navigating to them in the sidebar.\nView their code in the ",
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "inlineCode",
              { parentName: "p" },
              "src/stories"
            ),
            " directory to learn how they work.\nWe recommend building UIs with a ",
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                parentName: "p",
                href: "https://componentdriven.org",
                target: "_blank",
                rel: "nofollow noopener noreferrer",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "strong",
                { parentName: "a" },
                "component-driven"
              )
            ),
            " process starting with atomic components and ending with pages."
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "div",
            { className: "subheading" },
            "Configure"
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "div",
            { className: "link-list" },
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                className: "link-item",
                href: "https://storybook.js.org/docs/react/addons/addon-types",
                target: "_blank",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)("img", {
                src: _assets_plugin_svg__WEBPACK_IMPORTED_MODULE_12___default.a,
                alt: "plugin",
              }),
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "span",
                null,
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  "strong",
                  null,
                  "Presets for popular tools"
                ),
                "Easy setup for TypeScript, SCSS and more."
              )
            ),
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                className: "link-item",
                href: "https://storybook.js.org/docs/react/configure/webpack",
                target: "_blank",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)("img", {
                src: _assets_stackalt_svg__WEBPACK_IMPORTED_MODULE_14___default.a,
                alt: "Build",
              }),
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "span",
                null,
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  "strong",
                  null,
                  "Build configuration"
                ),
                "How to customize webpack and Babel"
              )
            ),
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                className: "link-item",
                href: "https://storybook.js.org/docs/react/configure/styling-and-css",
                target: "_blank",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)("img", {
                src: _assets_colors_svg__WEBPACK_IMPORTED_MODULE_8___default.a,
                alt: "colors",
              }),
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "span",
                null,
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  "strong",
                  null,
                  "Styling"
                ),
                "How to load and configure CSS libraries"
              )
            ),
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                className: "link-item",
                href: "https://storybook.js.org/docs/react/get-started/setup#configure-storybook-for-your-stack",
                target: "_blank",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)("img", {
                src: _assets_flow_svg__WEBPACK_IMPORTED_MODULE_11___default.a,
                alt: "flow",
              }),
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "span",
                null,
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  "strong",
                  null,
                  "Data"
                ),
                "Providers and mocking for data libraries"
              )
            )
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "div",
            { className: "subheading" },
            "Learn"
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "div",
            { className: "link-list" },
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                className: "link-item",
                href: "https://storybook.js.org/docs",
                target: "_blank",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)("img", {
                src: _assets_repo_svg__WEBPACK_IMPORTED_MODULE_13___default.a,
                alt: "repo",
              }),
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "span",
                null,
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  "strong",
                  null,
                  "Storybook documentation"
                ),
                "Configure, customize, and extend"
              )
            ),
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                className: "link-item",
                href: "https://storybook.js.org/tutorials/",
                target: "_blank",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)("img", {
                src: _assets_direction_svg__WEBPACK_IMPORTED_MODULE_10___default.a,
                alt: "direction",
              }),
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "span",
                null,
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  "strong",
                  null,
                  "In-depth guides"
                ),
                "Best practices from leading teams"
              )
            ),
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                className: "link-item",
                href: "https://github.com/storybookjs/storybook",
                target: "_blank",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)("img", {
                src: _assets_code_brackets_svg__WEBPACK_IMPORTED_MODULE_7___default.a,
                alt: "code",
              }),
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "span",
                null,
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  "strong",
                  null,
                  "GitHub project"
                ),
                "View the source and add issues"
              )
            ),
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "a",
              {
                className: "link-item",
                href: "https://discord.gg/storybook",
                target: "_blank",
              },
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)("img", {
                src: _assets_comments_svg__WEBPACK_IMPORTED_MODULE_9___default.a,
                alt: "comments",
              }),
              Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                "span",
                null,
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  "strong",
                  null,
                  "Discord chat"
                ),
                "Chat with maintainers and the community"
              )
            )
          ),
          Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
            "div",
            { className: "tip-wrapper" },
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "span",
              { className: "tip" },
              "Tip"
            ),
            "Edit the Markdown in",
            " ",
            Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
              "code",
              null,
              "src/stories/Introduction.stories.mdx"
            )
          )
        );
      }
      (MDXContent.displayName = "MDXContent"), (MDXContent.isMDXComponent = !0);
      var __page = function __page() {
        throw new Error("Docs-only story");
      };
      __page.parameters = { docsOnly: !0 };
      var componentMeta = {
          title: "Example/Introduction",
          includeStories: ["__page"],
        },
        mdxStoryNameToKey = {};
      (componentMeta.parameters = componentMeta.parameters || {}),
        (componentMeta.parameters.docs = Object.assign(
          {},
          componentMeta.parameters.docs || {},
          {
            page: function page() {
              return Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                _storybook_addon_docs__WEBPACK_IMPORTED_MODULE_6__.a,
                {
                  mdxStoryNameToKey: mdxStoryNameToKey,
                  mdxComponentAnnotations: componentMeta,
                },
                Object(_mdx_js_react__WEBPACK_IMPORTED_MODULE_5__.b)(
                  MDXContent,
                  null
                )
              );
            },
          }
        )),
        (__webpack_exports__.default = componentMeta);
    },
    "./src/stories/Page.stories.tsx": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__),
        __webpack_require__.d(__webpack_exports__, "LoggedIn", function () {
          return LoggedIn;
        }),
        __webpack_require__.d(__webpack_exports__, "LoggedOut", function () {
          return LoggedOut;
        });
      __webpack_require__("./node_modules/core-js/modules/es.object.assign.js"),
        __webpack_require__(
          "./node_modules/core-js/modules/es.function.bind.js"
        ),
        __webpack_require__("../../../node_modules/react/index.js");
      var Header = __webpack_require__("./src/stories/Header.tsx"),
        jsx_runtime =
          (__webpack_require__("./src/stories/page.css"),
          __webpack_require__("../../../node_modules/react/jsx-runtime.js")),
        Page_Page = function Page(_ref) {
          var user = _ref.user,
            onLogin = _ref.onLogin,
            onLogout = _ref.onLogout,
            onCreateAccount = _ref.onCreateAccount;
          return Object(jsx_runtime.jsxs)("article", {
            children: [
              Object(jsx_runtime.jsx)(Header.a, {
                user: user,
                onLogin: onLogin,
                onLogout: onLogout,
                onCreateAccount: onCreateAccount,
              }),
              Object(jsx_runtime.jsxs)("section", {
                children: [
                  Object(jsx_runtime.jsx)("h2", {
                    children: "Pages in Storybook",
                  }),
                  Object(jsx_runtime.jsxs)("p", {
                    children: [
                      "We recommend building UIs with a",
                      " ",
                      Object(jsx_runtime.jsx)("a", {
                        href: "https://componentdriven.org",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        children: Object(jsx_runtime.jsx)("strong", {
                          children: "component-driven",
                        }),
                      }),
                      " ",
                      "process starting with atomic components and ending with pages.",
                    ],
                  }),
                  Object(jsx_runtime.jsx)("p", {
                    children:
                      "Render pages with mock data. This makes it easy to build and review page states without needing to navigate to them in your app. Here are some handy patterns for managing page data in Storybook:",
                  }),
                  Object(jsx_runtime.jsxs)("ul", {
                    children: [
                      Object(jsx_runtime.jsx)("li", {
                        children:
                          'Use a higher-level connected component. Storybook helps you compose such data from the "args" of child component stories',
                      }),
                      Object(jsx_runtime.jsx)("li", {
                        children:
                          "Assemble data in the page component from your services. You can mock these services out using Storybook.",
                      }),
                    ],
                  }),
                  Object(jsx_runtime.jsxs)("p", {
                    children: [
                      "Get a guided tutorial on component-driven development at",
                      " ",
                      Object(jsx_runtime.jsx)("a", {
                        href: "https://storybook.js.org/tutorials/",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        children: "Storybook tutorials",
                      }),
                      ". Read more in the",
                      " ",
                      Object(jsx_runtime.jsx)("a", {
                        href: "https://storybook.js.org/docs",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        children: "docs",
                      }),
                      ".",
                    ],
                  }),
                  Object(jsx_runtime.jsxs)("div", {
                    className: "tip-wrapper",
                    children: [
                      Object(jsx_runtime.jsx)("span", {
                        className: "tip",
                        children: "Tip",
                      }),
                      " Adjust the width of the canvas with the",
                      " ",
                      Object(jsx_runtime.jsx)("svg", {
                        width: "10",
                        height: "10",
                        viewBox: "0 0 12 12",
                        xmlns: "http://www.w3.org/2000/svg",
                        children: Object(jsx_runtime.jsx)("g", {
                          fill: "none",
                          fillRule: "evenodd",
                          children: Object(jsx_runtime.jsx)("path", {
                            d: "M1.5 5.2h4.8c.3 0 .5.2.5.4v5.1c-.1.2-.3.3-.4.3H1.4a.5.5 0 01-.5-.4V5.7c0-.3.2-.5.5-.5zm0-2.1h6.9c.3 0 .5.2.5.4v7a.5.5 0 01-1 0V4H1.5a.5.5 0 010-1zm0-2.1h9c.3 0 .5.2.5.4v9.1a.5.5 0 01-1 0V2H1.5a.5.5 0 010-1zm4.3 5.2H2V10h3.8V6.2z",
                            id: "a",
                            fill: "#999",
                          }),
                        }),
                      }),
                      "Viewports addon in the toolbar",
                    ],
                  }),
                ],
              }),
            ],
          });
        };
      Page_Page.displayName = "Page";
      try {
        (Page_Page.displayName = "Page"),
          (Page_Page.__docgenInfo = {
            description: "",
            displayName: "Page",
            props: {
              user: {
                defaultValue: null,
                description: "",
                name: "user",
                required: !1,
                type: { name: "{}" },
              },
              onLogin: {
                defaultValue: null,
                description: "",
                name: "onLogin",
                required: !0,
                type: { name: "() => void" },
              },
              onLogout: {
                defaultValue: null,
                description: "",
                name: "onLogout",
                required: !0,
                type: { name: "() => void" },
              },
              onCreateAccount: {
                defaultValue: null,
                description: "",
                name: "onCreateAccount",
                required: !0,
                type: { name: "() => void" },
              },
            },
          }),
          "undefined" != typeof STORYBOOK_REACT_CLASSES &&
            (STORYBOOK_REACT_CLASSES["src/stories/Page.tsx#Page"] = {
              docgenInfo: Page_Page.__docgenInfo,
              name: "Page",
              path: "src/stories/Page.tsx#Page",
            });
      } catch (__react_docgen_typescript_loader_error) {}
      var Header_stories = __webpack_require__(
          "./src/stories/Header.stories.tsx"
        ),
        Page_stories_Template =
          ((__webpack_exports__.default = {
            title: "Example/Page",
            component: Page_Page,
          }),
          function Template(args) {
            return Object(jsx_runtime.jsx)(Page_Page, Object.assign({}, args));
          });
      Page_stories_Template.displayName = "Template";
      var LoggedIn = Page_stories_Template.bind({});
      LoggedIn.args = Object.assign({}, Header_stories.LoggedIn.args);
      var LoggedOut = Page_stories_Template.bind({});
      (LoggedOut.args = Object.assign({}, Header_stories.LoggedOut.args)),
        (LoggedIn.parameters = Object.assign(
          { storySource: { source: "(args) => <Page {...args} />" } },
          LoggedIn.parameters
        )),
        (LoggedOut.parameters = Object.assign(
          { storySource: { source: "(args) => <Page {...args} />" } },
          LoggedOut.parameters
        ));
    },
    "./src/stories/assets/code-brackets.svg": function (
      module,
      exports,
      __webpack_require__
    ) {
      module.exports =
        __webpack_require__.p + "static/media/code-brackets.2e1112d7.svg";
    },
    "./src/stories/assets/colors.svg": function (
      module,
      exports,
      __webpack_require__
    ) {
      module.exports =
        __webpack_require__.p + "static/media/colors.a4bd0486.svg";
    },
    "./src/stories/assets/comments.svg": function (
      module,
      exports,
      __webpack_require__
    ) {
      module.exports =
        __webpack_require__.p + "static/media/comments.a3859089.svg";
    },
    "./src/stories/assets/direction.svg": function (
      module,
      exports,
      __webpack_require__
    ) {
      module.exports =
        __webpack_require__.p + "static/media/direction.b770f9af.svg";
    },
    "./src/stories/assets/flow.svg": function (
      module,
      exports,
      __webpack_require__
    ) {
      module.exports = __webpack_require__.p + "static/media/flow.edad2ac1.svg";
    },
    "./src/stories/assets/plugin.svg": function (
      module,
      exports,
      __webpack_require__
    ) {
      module.exports =
        __webpack_require__.p + "static/media/plugin.d494b228.svg";
    },
    "./src/stories/assets/repo.svg": function (
      module,
      exports,
      __webpack_require__
    ) {
      module.exports = __webpack_require__.p + "static/media/repo.6d496322.svg";
    },
    "./src/stories/assets/stackalt.svg": function (
      module,
      exports,
      __webpack_require__
    ) {
      module.exports =
        __webpack_require__.p + "static/media/stackalt.dba9fbb3.svg";
    },
    "./src/stories/header.css": function (
      module,
      exports,
      __webpack_require__
    ) {
      var api = __webpack_require__(
          "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
        ),
        content = __webpack_require__(
          "./node_modules/css-loader/dist/cjs.js?!./node_modules/postcss-loader/dist/cjs.js?!./src/stories/header.css"
        );
      "string" ==
        typeof (content = content.__esModule ? content.default : content) &&
        (content = [[module.i, content, ""]]);
      var options = { insert: "head", singleton: !1 };
      api(content, options);
      module.exports = content.locals || {};
    },
    "./src/stories/page.css": function (module, exports, __webpack_require__) {
      var api = __webpack_require__(
          "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
        ),
        content = __webpack_require__(
          "./node_modules/css-loader/dist/cjs.js?!./node_modules/postcss-loader/dist/cjs.js?!./src/stories/page.css"
        );
      "string" ==
        typeof (content = content.__esModule ? content.default : content) &&
        (content = [[module.i, content, ""]]);
      var options = { insert: "head", singleton: !1 };
      api(content, options);
      module.exports = content.locals || {};
    },
    "./storybook-init-framework-entry.js": function (
      module,
      __webpack_exports__,
      __webpack_require__
    ) {
      "use strict";
      __webpack_require__.r(__webpack_exports__);
      __webpack_require__(
        "./node_modules/@storybook/react/dist/esm/client/index.js"
      );
    },
    0: function (module, exports, __webpack_require__) {
      __webpack_require__(
        "./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js"
      ),
        __webpack_require__(
          "./node_modules/@storybook/core-client/dist/esm/globals/globals.js"
        ),
        __webpack_require__("./storybook-init-framework-entry.js"),
        __webpack_require__(
          "./node_modules/@storybook/addon-docs/dist/esm/frameworks/common/config.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/addon-docs/dist/esm/frameworks/react/config.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/react/dist/esm/client/preview/config-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/addon-links/dist/esm/preset/addDecorator.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/addon-actions/dist/esm/preset/addDecorator.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/addon-actions/dist/esm/preset/addArgs.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/addon-backgrounds/dist/esm/preset/addDecorator.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/addon-backgrounds/dist/esm/preset/addParameter.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/addon-measure/dist/esm/preset/addDecorator.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./node_modules/@storybook/addon-outline/dist/esm/preset/addDecorator.js-generated-config-entry.js"
        ),
        __webpack_require__(
          "./.storybook/preview.js-generated-config-entry.js"
        ),
        (module.exports = __webpack_require__("./generated-stories-entry.js"));
    },
    1: function (module, exports) {},
  },
  [[0, 4, 5]],
]);

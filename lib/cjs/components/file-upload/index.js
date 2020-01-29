'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var __chunk_1 = require('../../_virtual/_rollupPluginBabelHelpers.js');
var react = require('react');
var h = _interopDefault(require('react-hyperscript'));
var core = require('@blueprintjs/core');
var classNames = _interopDefault(require('classnames'));
var Dropzone = _interopDefault(require('react-dropzone'));

var FileList,
    FileListItem,
    boundMethodCheck = function boundMethodCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new Error('Bound instance method accessed before binding');
  }
};

FileListItem = function FileListItem(props) {
  var file;
  file = props.file;
  return h(core.Tag, {
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

exports.FileUploadComponent = function () {
  var FileUploadComponent =
  /*#__PURE__*/
  function (_Component) {
    __chunk_1.inherits(FileUploadComponent, _Component);

    function FileUploadComponent() {
      var _this;

      __chunk_1.classCallCheck(this, FileUploadComponent);

      _this = __chunk_1.possibleConstructorReturn(this, __chunk_1.getPrototypeOf(FileUploadComponent).apply(this, arguments));
      _this.renderDropzone = _this.renderDropzone.bind(__chunk_1.assertThisInitialized(_this));
      return _this;
    }

    __chunk_1.createClass(FileUploadComponent, [{
      key: "renderDropzone",
      value: function renderDropzone(_ref) {
        var getRootProps = _ref.getRootProps,
            getInputProps = _ref.getInputProps,
            isDragActive = _ref.isDragActive;
        var className, files, inputProps, msg, rootProps;
        boundMethodCheck(this, FileUploadComponent);
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

        return h('div', __chunk_1.objectSpread2({
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
  }(react.Component);
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
//# sourceMappingURL=index.js.map

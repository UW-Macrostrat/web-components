import { inherits as _inherits, classCallCheck as _classCallCheck, possibleConstructorReturn as _possibleConstructorReturn, getPrototypeOf as _getPrototypeOf, assertThisInitialized as _assertThisInitialized, createClass as _createClass, objectSpread2 as _objectSpread2 } from '../../_virtual/_rollupPluginBabelHelpers.js';
import { Component } from 'react';
import h from 'react-hyperscript';
import { Tag } from '@blueprintjs/core';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';

var FileList,
    FileListItem,
    FileUploadComponent,
    boundMethodCheck = function boundMethodCheck(instance, Constructor) {
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

export { FileUploadComponent };
//# sourceMappingURL=index.js.map

import { Component } from 'react';
import h from 'react-hyperscript';
import { Tag } from '@blueprintjs/core';
import classNames from 'classnames';
import Dropzone from 'react-dropzone';

var FileList, FileListItem, FileUploadComponent,
  boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

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
      boundMethodCheck(this, FileUploadComponent);
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

export { FileUploadComponent };

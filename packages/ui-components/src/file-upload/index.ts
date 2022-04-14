// @ts-nocheck
import "./main.sass";
import { Component } from "react";
import h from "@macrostrat/hyper";
import { Tag } from "@blueprintjs/core";
import Dropzone from "react-dropzone";
import classNames from "classnames";

const FileListItem = function (props) {
  const { file } = props;
  return h(Tag, { icon: "document" }, file.name);
};

const FileList = function (props) {
  let { files, placeholder } = props;
  if (placeholder == null) {
    placeholder = "Choose file...";
  }
  if (files == null || !(files.length > 0)) {
    return placeholder;
  }
  return h(
    "div.files",
    files.map((file) => h(FileListItem, { file }))
  );
};

interface FileUploadProps {
  files: any[];
  onAddFile(): void;
  onCancel(): void;
}

class FileUploadComponent extends Component<FileUploadProps> {
  static defaultProps = {
    onAddFile() {},
    onCancel() {},
  };

  constructor(props) {
    super(props);
    this.renderDropzone = this.renderDropzone.bind(this);
  }

  renderDropzone({ getRootProps, getInputProps, isDragActive }) {
    const { files } = this.props;
    const rootProps = getRootProps();
    const className = classNames("file-upload", {
      "dropzone-active": isDragActive,
    });
    const inputProps = getInputProps();
    inputProps.style = {};
    inputProps.className = "bp4-large";
    let msg = "Drop files here";
    if (!isDragActive) {
      msg += ", or click to upload";
    }

    return h("div", { className, ...rootProps }, [
      h("label.bp4-file-input.bp4-large", [
        h("input", inputProps),
        h("div.bp4-file-upload-input", [
          h(FileList, { files, placeholder: msg }),
        ]),
      ]),
    ]);
  }

  render() {
    return h(
      Dropzone,
      {
        onDrop: this.props.onAddFile,
        onFileDialogCancel: this.props.onCancel,
      },
      this.renderDropzone
    );
  }
}

export { FileUploadComponent };
